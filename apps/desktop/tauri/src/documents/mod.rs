//! The folder-backed documents layer.
//!
//! A local workspace is a folder on disk. The folder holds the document bytes;
//! the on-device store (the `documents` collection) holds one record per file so
//! each keeps a stable id across renames. SQLite can't touch the filesystem, so
//! this module is only the byte-level and reconcile operations the index can't do
//! itself: read a file's bytes, write bytes (an upload, or a redaction sibling),
//! scan the folder to reconcile the index, and remove a file. The record CRUD
//! stays on the generic `store_*` commands.
//!
//! Every path is resolved under the workspace's folder and checked to stay
//! within it, so a crafted relative path can't read or write outside the folder.
//! Bytes cross to the webview as a raw `tauri::ipc::Response` (an ArrayBuffer),
//! not a JSON number array — the way Tauri v2 recommends for binary payloads.

use std::path::{Path, PathBuf};

use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::ipc::Response;
use tauri::{AppHandle, Runtime};

use crate::files::pick_folder;

/// One file found in a workspace folder during a scan — the facts the frontend
/// needs to reconcile the index: the path relative to the folder, the byte size,
/// and the content hash (so a rename is matched to its record by content and an
/// edit is detected as a changed hash).
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScannedFile {
    /// Path relative to the workspace folder, forward-slashed (e.g. `a/b.pdf`).
    pub path: String,
    /// File size in bytes.
    pub size: u64,
    /// Lower-case hex SHA-256 of the file's bytes.
    pub hash: String,
}

/// Open a native folder picker for a new local workspace. Returns the chosen
/// absolute path, or `None` if the user cancelled.
#[tauri::command]
pub async fn pick_workspace_folder<R: Runtime>(
    app: AppHandle<R>,
) -> Result<Option<String>, String> {
    Ok(pick_folder(&app)
        .await?
        .map(|path| path.to_string_lossy().into_owned()))
}

/// Read one document's bytes from the workspace folder, as a raw IPC response
/// (an ArrayBuffer on the webview side). `path` is relative to `folder`.
#[tauri::command]
pub fn documents_read(folder: String, path: String) -> Result<Response, String> {
    let resolved = resolve(&folder, &path)?;
    let bytes = std::fs::read(&resolved).map_err(|err| err.to_string())?;
    Ok(Response::new(bytes))
}

/// Write bytes into the workspace folder at `path` (relative to `folder`),
/// creating parent directories as needed. Used for an upload and for a
/// redaction's sibling output. The bytes arrive as a plain argument, matching
/// the existing `save_file` command — writes are occasional, so the read path's
/// raw-response optimization isn't needed here.
#[tauri::command]
pub fn documents_write(folder: String, path: String, data: Vec<u8>) -> Result<(), String> {
    let resolved = resolve(&folder, &path)?;
    if let Some(parent) = resolved.parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    std::fs::write(&resolved, &data).map_err(|err| err.to_string())
}

/// Delete one document from the workspace folder. A no-op if it is already gone.
#[tauri::command]
pub fn documents_remove(folder: String, path: String) -> Result<(), String> {
    let resolved = resolve(&folder, &path)?;
    match std::fs::remove_file(&resolved) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

/// Scan the workspace folder, returning every regular file with its relative
/// path, size, and content hash. The frontend reconciles this against the index
/// — matching renames by hash, detecting edits as a changed hash, and dropping
/// records whose file is gone. Hidden files (dot-prefixed) are skipped.
#[tauri::command]
pub fn documents_scan(folder: String) -> Result<Vec<ScannedFile>, String> {
    let root = PathBuf::from(&folder);
    if !root.is_dir() {
        return Err(format!("workspace folder is not a directory: {folder}"));
    }
    let mut out = Vec::new();
    scan_dir(&root, &root, &mut out)?;
    Ok(out)
}

/// Recursively collect files under `dir`, pathing each relative to `root`.
fn scan_dir(root: &Path, dir: &Path, out: &mut Vec<ScannedFile>) -> Result<(), String> {
    for entry in std::fs::read_dir(dir).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        let path = entry.path();
        let name = entry.file_name();
        // Skip hidden entries (dotfiles, .DS_Store, and the like).
        if name.to_string_lossy().starts_with('.') {
            continue;
        }
        let file_type = entry.file_type().map_err(|err| err.to_string())?;
        if file_type.is_dir() {
            scan_dir(root, &path, out)?;
        } else if file_type.is_file() {
            let bytes = std::fs::read(&path).map_err(|err| err.to_string())?;
            let rel = path
                .strip_prefix(root)
                .map_err(|err| err.to_string())?
                .to_string_lossy()
                .replace('\\', "/");
            out.push(ScannedFile {
                path: rel,
                size: bytes.len() as u64,
                hash: hex_sha256(&bytes),
            });
        }
    }
    Ok(())
}

/// Lower-case hex SHA-256 of `bytes`.
fn hex_sha256(bytes: &[u8]) -> String {
    let digest = Sha256::digest(bytes);
    let mut hex = String::with_capacity(digest.len() * 2);
    for byte in digest {
        use std::fmt::Write;
        let _ = write!(hex, "{byte:02x}");
    }
    hex
}

/// Resolve `path` (relative to `folder`) to an absolute path, rejecting anything
/// that escapes the folder. `folder` must be absolute (it comes from the native
/// picker); `path` must be relative and free of `..` components.
fn resolve(folder: &str, path: &str) -> Result<PathBuf, String> {
    let root = PathBuf::from(folder);
    let rel = Path::new(path);
    if rel.is_absolute() {
        return Err("document path must be relative to the workspace folder".to_owned());
    }
    for component in rel.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("document path must not escape the workspace folder".to_owned());
        }
    }
    Ok(root.join(rel))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A temp directory that cleans itself up, so the FS commands can run against
    /// a real folder without a Tauri app. Avoids a dev-dependency on `tempfile`.
    struct TempDir(PathBuf);
    impl TempDir {
        fn new(tag: &str) -> Self {
            let mut dir = std::env::temp_dir();
            dir.push(format!(
                "nvisy-docs-test-{tag}-{}",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            ));
            std::fs::create_dir_all(&dir).unwrap();
            Self(dir)
        }

        fn path(&self) -> String {
            self.0.to_string_lossy().into_owned()
        }
    }
    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn write_scan_read_round_trip() {
        let dir = TempDir::new("round-trip");
        let folder = dir.path();

        documents_write(folder.clone(), "a.txt".into(), b"hello".to_vec()).unwrap();
        documents_write(folder.clone(), "sub/b.txt".into(), b"world".to_vec()).unwrap();

        let mut files = documents_scan(folder.clone()).unwrap();
        files.sort_by(|a, b| a.path.cmp(&b.path));
        assert_eq!(files.len(), 2);
        assert_eq!(files[0].path, "a.txt");
        assert_eq!(files[0].size, 5);
        // Nested paths are forward-slashed and relative to the folder.
        assert_eq!(files[1].path, "sub/b.txt");
        // The hash is the content's SHA-256.
        assert_eq!(files[0].hash, hex_sha256(b"hello"));

        // The read command returns the exact bytes written.
        let resolved = resolve(&folder, "a.txt").unwrap();
        assert_eq!(std::fs::read(resolved).unwrap(), b"hello");
    }

    #[test]
    fn scan_detects_edit_and_skips_hidden() {
        let dir = TempDir::new("edit");
        let folder = dir.path();

        documents_write(folder.clone(), "doc.txt".into(), b"one".to_vec()).unwrap();
        let before = &documents_scan(folder.clone()).unwrap()[0].hash.clone();

        // A hidden file is skipped by the scan.
        std::fs::write(PathBuf::from(&folder).join(".hidden"), b"x").unwrap();
        // Editing the file changes its hash — the reconcile signal.
        documents_write(folder.clone(), "doc.txt".into(), b"two".to_vec()).unwrap();

        let files = documents_scan(folder.clone()).unwrap();
        assert_eq!(files.len(), 1, "the hidden file is not listed");
        assert_ne!(&files[0].hash, before, "an edit changes the hash");
    }

    #[test]
    fn remove_is_idempotent() {
        let dir = TempDir::new("remove");
        let folder = dir.path();
        documents_write(folder.clone(), "gone.txt".into(), b"x".to_vec()).unwrap();
        documents_remove(folder.clone(), "gone.txt".into()).unwrap();
        assert!(documents_scan(folder.clone()).unwrap().is_empty());
        // Removing a file that is already gone is a no-op, not an error.
        documents_remove(folder.clone(), "gone.txt".into()).unwrap();
    }

    #[test]
    fn resolve_rejects_traversal_and_absolute() {
        let folder = "/tmp/ws";
        assert!(resolve(folder, "../escape.txt").is_err());
        assert!(resolve(folder, "a/../../escape.txt").is_err());
        assert!(resolve(folder, "/etc/passwd").is_err());
        // An ordinary nested path resolves under the folder.
        let ok = resolve(folder, "sub/doc.txt").unwrap();
        assert!(ok.starts_with(folder));
    }

    #[test]
    fn write_rejects_traversal() {
        let dir = TempDir::new("traversal");
        let folder = dir.path();
        assert!(documents_write(folder.clone(), "../outside.txt".into(), b"x".to_vec()).is_err());
        assert!(documents_read(folder.clone(), "../../etc/hosts".into()).is_err());
    }
}
