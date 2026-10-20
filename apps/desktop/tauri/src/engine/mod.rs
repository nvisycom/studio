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

/// Detect over one document on-device, returning the reviewable audit.
///
/// `bytes` and `name` are the document; `name`'s extension selects the codec.
/// `policies` are the detection intent (the same inline policy shape the server
/// takes). `context` is the optional asserted scope (languages, jurisdictions,
/// tags); omitted means the recognizers' own defaults.
///
/// The audit serializes to the same shape the hosted server returns, so the
/// shared UI consumes it unchanged.
#[tauri::command]
pub async fn detect(
    engine: State<'_, EngineState>,
    name: String,
    bytes: Vec<u8>,
    policies: Vec<Policy>,
    context: Option<DocumentContext>,
) -> Result<Audit, String> {
    let document = Document::new(name, bytes);
    let request = match context {
        Some(context) => RequestContext::new().with_context(context),
        None => RequestContext::new(),
    };

    let analyzed = engine
        .engine
        .analyze(document, policies, request)
        .await
        .map_err(|err| err.to_string())?;

    Ok(analyzed.audit)
}

/// The redacted output of [`redact`]: the new document's bytes and name.
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Redacted {
    name: String,
    bytes: Vec<u8>,
}

/// Redact one document on-device from a prior detection's audit, returning the
/// redacted bytes.
///
/// `audit` is the serialized audit a prior [`detect`] produced. An [`Audit`] is
/// not directly deserializable (its report is rebuilt against this engine's
/// codec registry), so it arrives as JSON and is read back through the engine.
/// `edits` are the reviewer's decisions, folded into the audit before redacting
/// (the engine validates and applies them, as the server does). `policies` are
/// the same ones that detection ran. `key` supplies the secret for keyed
/// operators (HMAC, AES) when a policy uses one; omitted otherwise.
#[tauri::command]
pub async fn redact(
    engine: State<'_, EngineState>,
    name: String,
    bytes: Vec<u8>,
    policies: Vec<Policy>,
    audit: serde_json::Value,
    edits: Option<EditSet>,
    key: Option<KeyConfig>,
) -> Result<Redacted, String> {
    let document = Document::new(name, bytes);
    let audit = engine
        .engine
        .deserialize_audit(audit)
        .map_err(|err| err.to_string())?;

    let redacted = engine
        .engine
        .anonymize(document, policies, audit, edits, key)
        .await
        .map_err(|err| err.to_string())?;

    Ok(Redacted {
        name: redacted.name.to_string(),
        bytes: redacted.bytes.to_vec(),
    })
}
