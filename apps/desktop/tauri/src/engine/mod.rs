//! On-device detection and redaction behind the web layer's engine seam.
//!
//! The shared UI runs detection and redaction through a host seam; on the web
//! that seam calls the hosted server, and on desktop the commands here fill it
//! with an in-process [`LocalEngine`] so a document's bytes never leave the
//! machine. The engine is built once at startup and shared (it is `Arc`-backed),
//! and each command drives one analyze / anonymize against it.

use studio_elide::{
    Audit, Document, DocumentContext, EditSet, KeyConfig, LocalEngine, Policy, RequestContext,
};
use tauri::State;

use crate::documents::WorkspaceFolders;

/// A reference to a document on disk: the workspace it belongs to and the file's
/// path within that workspace's bound folder. The engine resolves the folder from
/// the id (never a caller-supplied path) and reads the bytes itself, so no
/// document bytes cross the IPC boundary and one workspace can't read another's.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DocRef {
    workspace_id: String,
    path: String,
}

/// The hard cap on a document analyzed on-device. Bounds the memory and time of
/// one detection, and enforces the "bound document size before detection"
/// mitigation for the quick-xml advisory on the folder-workspace path (which
/// doesn't go through the drop/upload cap). 512 MiB is generous for the lawyer
/// audience's documents while keeping a crafted input from running unbounded.
const MAX_DETECT_BYTES: u64 = 512 * 1024 * 1024;

/// The on-device engine, managed so every command shares one configured lineup.
///
/// Built with the built-in local lineup (pattern recognizers plus language
/// detection, no remote enrichment); the deployment-TOML-configured lineup is a
/// later step.
pub struct EngineState {
    engine: LocalEngine,
}

impl Default for EngineState {
    fn default() -> Self {
        Self {
            engine: LocalEngine::local(),
        }
    }
}

/// Read a document's bytes from its workspace's bound folder, size-bounded.
///
/// The document already lives on disk in the folder, so the engine reads it
/// itself rather than receiving the bytes over IPC — no multi-MB payload crosses
/// the webview boundary in either direction. The size is checked against the
/// cap before the read, so an oversized file is rejected without loading it.
fn read_document(folders: &WorkspaceFolders, doc: &DocRef) -> Result<Vec<u8>, String> {
    use std::io::Read;

    let resolved = folders.resolve_path(&doc.workspace_id, &doc.path)?;
    // Open once and read through that handle, so the size check and the read see
    // the same file — a folder workspace is open to other processes (sync
    // clients, downloads), so a second path lookup could hit a grown or swapped
    // file and bypass the cap. `take(cap + 1)` bounds the read regardless of what
    // metadata reported.
    let file = std::fs::File::open(&resolved).map_err(|err| err.to_string())?;
    let size = file.metadata().map_err(|err| err.to_string())?.len();
    if size > MAX_DETECT_BYTES {
        return Err(format!(
            "document is too large to process on-device ({size} bytes; limit {MAX_DETECT_BYTES})"
        ));
    }
    let mut bytes = Vec::with_capacity(size as usize);
    file.take(MAX_DETECT_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(|err| err.to_string())?;
    if bytes.len() as u64 > MAX_DETECT_BYTES {
        return Err("document grew past the on-device limit while reading".to_owned());
    }
    Ok(bytes)
}

/// Detect over one document on-device, returning the reviewable audit.
///
/// The document is read from disk (`workspaceId` + relative `path`, the
/// workspace's bound folder); its name's extension selects the codec. `policies` are the
/// detection intent (the same inline policy shape the server takes). `context` is
/// the optional asserted scope (languages, jurisdictions, tags); omitted means
/// the recognizers' own defaults.
///
/// The audit serializes to the same shape the hosted server returns, so the
/// shared UI consumes it unchanged.
#[tauri::command]
pub async fn detect(
    engine: State<'_, EngineState>,
    folders: State<'_, WorkspaceFolders>,
    document: DocRef,
    policies: Vec<Policy>,
    context: Option<DocumentContext>,
) -> Result<Audit, String> {
    let bytes = read_document(&folders, &document)?;
    let name = file_name(&document.path);
    let request = match context {
        Some(context) => RequestContext::new().with_context(context),
        None => RequestContext::new(),
    };

    let analyzed = engine
        .engine
        .analyze(Document::new(name, bytes), policies, request)
        .await
        .map_err(|err| err.to_string())?;

    Ok(analyzed.audit)
}

/// The base file name of a folder-relative path (the part after the last `/`).
fn file_name(path: &str) -> String {
    path.rsplit('/').next().unwrap_or(path).to_owned()
}

/// The redacted output of [`redact`]: the output file's folder-relative path and
/// its base name. The bytes are written to disk (a sibling in the workspace
/// folder); the frontend reads them back through `documents_read` when the user
/// downloads, so no redacted bytes cross the IPC boundary here either.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Redacted {
    /// Base name of the output, e.g. `report.redacted.pdf`.
    name: String,
    /// Path of the output relative to the workspace folder.
    path: String,
}

/// Redact one document on-device from a prior detection's audit, writing the
/// redacted output as a sibling in the workspace folder and returning its path.
///
/// The input document is read from disk (`workspaceId` + relative `path`). `audit` is
/// the serialized audit a prior [`detect`] produced — an [`Audit`] is not
/// directly deserializable (its report is rebuilt against this engine's codec
/// registry), so it arrives as JSON and is read back through the engine. `edits`
/// are the reviewer's decisions, folded into the audit before redacting (the
/// engine validates and applies them, as the server does). `policies` are the
/// same ones detection ran. `key` supplies the secret for keyed operators (HMAC,
/// AES) when a policy uses one; omitted otherwise.
#[tauri::command]
pub async fn redact(
    engine: State<'_, EngineState>,
    folders: State<'_, WorkspaceFolders>,
    document: DocRef,
    policies: Vec<Policy>,
    audit: serde_json::Value,
    edits: Option<EditSet>,
    key: Option<KeyConfig>,
) -> Result<Redacted, String> {
    let bytes = read_document(&folders, &document)?;
    let name = file_name(&document.path);
    let audit = engine
        .engine
        .deserialize_audit(audit)
        .map_err(|err| err.to_string())?;

    let redacted = engine
        .engine
        .anonymize(Document::new(name, bytes), policies, audit, edits, key)
        .await
        .map_err(|err| err.to_string())?;

    // Write the output beside the input (same relative directory), under the
    // engine's chosen name — the frontend reads it back for download/listing.
    let out_name = redacted.name.to_string();
    let out_rel = match document.path.rsplit_once('/') {
        Some((dir, _)) => format!("{dir}/{out_name}"),
        None => out_name.clone(),
    };
    let out_abs = folders.resolve_path(&document.workspace_id, &out_rel)?;
    std::fs::write(&out_abs, redacted.bytes.as_ref()).map_err(|err| err.to_string())?;

    Ok(Redacted {
        name: out_name,
        path: out_rel,
    })
}
