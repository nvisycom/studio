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
//! The caller (the webview) supplies the `folder`, so it is NOT trusted: a FS
//! command acts only on a folder the app itself has allowed. A folder becomes
//! allowed in one way only — the user picks it through the native folder panel
//! (`pick_workspace_folder`) — and that fact is persisted to a file only Rust
//! writes, so a folder picked in a past session is re-allowed at load without
//! the webview being able to add one. The webview can never widen the set; a
//! crafted `folder` (`"/"`, `"C:\\"`) is simply not in it. Every `path` is then
//! resolved under the allowed folder and the resolved, canonicalized path is
//! confirmed to stay inside it, so neither a crafted `folder` nor a traversal
//! `path` can reach a file outside an allowed workspace folder. Bytes cross to
//! the webview as a raw `tauri::ipc::Response` (an ArrayBuffer), not a JSON
//! number array — the way Tauri v2 recommends for binary payloads.

use std::collections::HashSet;
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::ipc::Response;
use tauri::{AppHandle, Manager, Runtime, State};

use crate::files::pick_folder;

/// File under the app data dir that records the folders the user has picked.
/// Only Rust writes it (on a pick); the webview has no command that touches it,
/// so it can't widen the allowlist.
const ALLOWED_FILE: &str = "allowed-folders.json";

/// The set of folders the app has allowed FS access to (canonicalized), one per
/// local workspace. The webview supplies a `folder` on each FS call but is not
/// trusted; only a folder in this set is served. A folder enters the set only
/// when the user picks it ([`pick_workspace_folder`]); the set is persisted to
/// [`ALLOWED_FILE`] and re-seeded at startup ([`AllowedFolders::load`]), so past
/// picks survive a restart without the webview being able to add one.
#[derive(Default)]
pub struct AllowedFolders {
    set: Mutex<HashSet<PathBuf>>,
    /// The persistence file, set once at startup (unset before `load`, as in
    /// tests — then a write is simply not persisted).
    store: OnceLock<PathBuf>,
}

impl AllowedFolders {
    /// Seed the set from the persisted file and remember it for later writes.
    /// Called once at setup, when the app data dir is known. A missing or
    /// unreadable file just means no folders are allowed yet (first run).
    pub fn load<R: Runtime>(&self, app: &AppHandle<R>) {
        let Ok(dir) = app.path().app_data_dir() else {
            return;
        };
        let file = dir.join(ALLOWED_FILE);
        let _ = self.store.set(file.clone());
        let Ok(bytes) = std::fs::read(&file) else {
            return;
        };
        let Ok(folders) = serde_json::from_slice::<Vec<String>>(&bytes) else {
            return;
        };
        if let Ok(mut set) = self.set.lock() {
            for folder in folders {
                // Re-canonicalize on load: a folder moved or deleted since it was
                // picked simply drops out (it won't resolve), which is correct.
                if let Ok(path) = std::fs::canonicalize(&folder) {
                    set.insert(path);
                }
            }
        }
    }

    /// Record a folder as allowed (canonicalized) and persist the set. Only the
    /// pick command calls this, so the allowlist only ever grows by a user pick.
    fn allow(&self, folder: &str) {
        let Ok(path) = std::fs::canonicalize(folder) else {
            return;
        };
        let Ok(mut set) = self.set.lock() else {
            return;
        };
        if set.insert(path) {
            self.persist(&set);
        }
    }

    /// Write the current set to the persistence file (best-effort; a failed write
    /// just means the folder isn't remembered across a restart, not a crash).
    fn persist(&self, set: &HashSet<PathBuf>) {
        let Some(file) = self.store.get() else {
            return;
        };
        let folders: Vec<String> = set
            .iter()
            .map(|p| p.to_string_lossy().into_owned())
            .collect();
        if let Ok(json) = serde_json::to_vec(&folders) {
            if let Some(parent) = file.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = std::fs::write(file, json);
        }
    }

    /// The canonical form of `folder` if it is allowed, else `None`.
    fn resolve_allowed(&self, folder: &str) -> Option<PathBuf> {
        let canonical = std::fs::canonicalize(folder).ok()?;
        let set = self.set.lock().ok()?;
        set.contains(&canonical).then_some(canonical)
    }

    /// Resolve `path` under an allowed `folder` to an absolute, contained path.
    /// The engine commands use this to read a document straight from disk.
    ///
    /// # Errors
    ///
    /// - A string error if `folder` is not allowed, or `path` escapes it.
    pub fn resolve_path(&self, folder: &str, path: &str) -> Result<PathBuf, String> {
        resolve(self, folder, path)
    }
}

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
    allowed: State<'_, AllowedFolders>,
) -> Result<Option<String>, String> {
    let picked = pick_folder(&app).await?;
    if let Some(path) = &picked {
        allowed.allow(&path.to_string_lossy());
    }
    Ok(picked.map(|path| path.to_string_lossy().into_owned()))
}

/// Read one document's bytes from the workspace folder, as a raw IPC response
/// (an ArrayBuffer on the webview side). `path` is relative to `folder`, which
/// must be an allowed workspace folder.
#[tauri::command]
pub fn documents_read(
    allowed: State<'_, AllowedFolders>,
    folder: String,
    path: String,
) -> Result<Response, String> {
    let resolved = resolve(&allowed, &folder, &path)?;
    let bytes = std::fs::read(&resolved).map_err(|err| err.to_string())?;
    Ok(Response::new(bytes))
}

/// Write bytes into the workspace folder at `path` (relative to an allowed
/// `folder`), creating parent directories as needed. Used for an upload and for
/// a redaction's sibling output. The bytes arrive as a plain argument, matching
/// the existing `save_file` command — writes are occasional, so the read path's
/// raw-response optimization isn't needed here.
#[tauri::command]
pub fn documents_write(
    allowed: State<'_, AllowedFolders>,
    folder: String,
    path: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let resolved = resolve(&allowed, &folder, &path)?;
    if let Some(parent) = resolved.parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    std::fs::write(&resolved, &data).map_err(|err| err.to_string())
}

/// Delete one document from an allowed workspace folder. A no-op if it is already
/// gone.
#[tauri::command]
pub fn documents_remove(
    allowed: State<'_, AllowedFolders>,
    folder: String,
    path: String,
) -> Result<(), String> {
    let resolved = resolve(&allowed, &folder, &path)?;
    match std::fs::remove_file(&resolved) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

/// Scan an allowed workspace folder, returning every regular file with its
/// relative path, size, and content hash. The frontend reconciles this against
/// the index — matching renames by hash, detecting edits as a changed hash, and
/// dropping records whose file is gone. Hidden files (dot-prefixed) are skipped.
/// A file that can't be read (a permission error, a Windows lock) is skipped,
/// not fatal, so one bad file doesn't blank the whole list.
#[tauri::command]
pub fn documents_scan(
    allowed: State<'_, AllowedFolders>,
    folder: String,
) -> Result<Vec<ScannedFile>, String> {
    let root = allowed
        .resolve_allowed(&folder)
        .ok_or("folder is not an allowed workspace folder")?;
    if !root.is_dir() {
        return Err(format!("workspace folder is not a directory: {folder}"));
    }
    let mut out = Vec::new();
    scan_dir(&root, &root, &mut out)?;
    Ok(out)
}

/// Recursively collect files under `dir`, pathing each relative to `root`. A file
/// that can't be opened or hashed is skipped (logged), not fatal.
fn scan_dir(root: &Path, dir: &Path, out: &mut Vec<ScannedFile>) -> Result<(), String> {
    for entry in std::fs::read_dir(dir).map_err(|err| err.to_string())? {
        let entry = entry.map_err(|err| err.to_string())?;
        let path = entry.path();
        let name = entry.file_name();
        // Skip hidden entries (dotfiles, .DS_Store, and the like).
        if name.to_string_lossy().starts_with('.') {
            continue;
        }
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if file_type.is_dir() {
            scan_dir(root, &path, out)?;
        } else if file_type.is_file() {
            // Stream the hash so a large file isn't read fully into memory, and
            // skip (rather than fail the whole scan) a file we can't read.
            let Ok((size, hash)) = hash_file(&path) else {
                log::warn!("skipping unreadable file during scan: {}", path.display());
                continue;
            };
            let rel = path
                .strip_prefix(root)
                .map_err(|err| err.to_string())?
                .to_string_lossy()
                .replace('\\', "/");
            out.push(ScannedFile {
                path: rel,
                size,
                hash,
            });
        }
    }
    Ok(())
}

/// Stream a file through the hasher, returning `(size, lowercase-hex SHA-256)`
/// without reading the whole file into memory.
fn hash_file(path: &Path) -> std::io::Result<(u64, String)> {
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let size = std::io::copy(&mut file, &mut hasher)?;
    let digest = hasher.finalize();
    let mut hex = String::with_capacity(digest.len() * 2);
    for byte in digest {
        use std::fmt::Write;
        let _ = write!(hex, "{byte:02x}");
    }
    Ok((size, hex))
}

/// Resolve `path` (relative to `folder`) to an absolute path confined to an
/// ALLOWED workspace folder. `folder` is caller-supplied and untrusted, so it
/// must be one the app allowed; `path` must be relative and carry no root or
/// parent (`..`) component (which rules out Windows roots like `\Windows` and
/// `C:\` too, since those parse as a `RootDir`/`Prefix` component, not `Normal`).
/// The joined path is then canonicalized and confirmed to stay under the folder,
/// so a symlink inside the folder can't redirect out either.
fn resolve(allowed: &AllowedFolders, folder: &str, path: &str) -> Result<PathBuf, String> {
    let root = allowed
        .resolve_allowed(folder)
        .ok_or("folder is not an allowed workspace folder")?;

    let rel = Path::new(path);
    for component in rel.components() {
        if !matches!(component, Component::Normal(_) | Component::CurDir) {
            return Err("document path must be relative to the workspace folder".to_owned());
        }
    }

    let joined = root.join(rel);
    // Refuse a symlink at the final component. `exists()` below (and `fs::write`)
    // follow symlinks, so a link — even a dangling one, whose target doesn't
    // exist yet — could redirect a write outside the folder past the containment
    // check. `symlink_metadata` does not follow, so it catches the link itself.
    if std::fs::symlink_metadata(&joined)
        .map(|meta| meta.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("document path must not be a symlink".to_owned());
    }
    // Confirm containment after resolving symlinks. A file that doesn't exist yet
    // (a write) has no canonical form, so check its parent instead.
    let check = if joined.exists() {
        std::fs::canonicalize(&joined).map_err(|err| err.to_string())?
    } else {
        let parent = joined
            .parent()
            .ok_or("document path has no parent")?
            .to_path_buf();
        // The parent may also not exist yet (a nested upload); walk up to the
        // nearest existing ancestor and canonicalize that.
        let mut ancestor = parent.as_path();
        loop {
            if ancestor.exists() {
                break;
            }
            ancestor = ancestor
                .parent()
                .ok_or("document path escapes the folder")?;
        }
        std::fs::canonicalize(ancestor).map_err(|err| err.to_string())?
    };
    if !check.starts_with(&root) {
        return Err("document path escapes the workspace folder".to_owned());
    }
    Ok(joined)
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

    /// An `AllowedFolders` with `folder` already allowed, for the FS helpers.
    fn allowing(folder: &str) -> AllowedFolders {
        let allowed = AllowedFolders::default();
        allowed.allow(folder);
        allowed
    }

    /// Write bytes under an allowed folder (the command body, sans `State`).
    fn write(allowed: &AllowedFolders, folder: &str, path: &str, data: &[u8]) {
        let resolved = resolve(allowed, folder, path).unwrap();
        if let Some(parent) = resolved.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        std::fs::write(resolved, data).unwrap();
    }

    /// Scan an allowed folder (the command body, sans `State`).
    fn scan(allowed: &AllowedFolders, folder: &str) -> Vec<ScannedFile> {
        let root = allowed.resolve_allowed(folder).unwrap();
        let mut out = Vec::new();
        scan_dir(&root, &root, &mut out).unwrap();
        out
    }

    #[test]
    fn write_scan_read_round_trip() {
        let dir = TempDir::new("round-trip");
        let folder = dir.path();
        let allowed = allowing(&folder);

        write(&allowed, &folder, "a.txt", b"hello");
        write(&allowed, &folder, "sub/b.txt", b"world");

        let mut files = scan(&allowed, &folder);
        files.sort_by(|a, b| a.path.cmp(&b.path));
        assert_eq!(files.len(), 2);
        assert_eq!(files[0].path, "a.txt");
        assert_eq!(files[0].size, 5);
        // Nested paths are forward-slashed and relative to the folder.
        assert_eq!(files[1].path, "sub/b.txt");
        // The hash is the content's SHA-256.
        assert_eq!(
            files[0].hash,
            hash_file(&resolve(&allowed, &folder, "a.txt").unwrap())
                .unwrap()
                .1
        );

        // The resolved path reads back the exact bytes.
        let resolved = resolve(&allowed, &folder, "a.txt").unwrap();
        assert_eq!(std::fs::read(resolved).unwrap(), b"hello");
    }

    #[test]
    fn scan_detects_edit_and_skips_hidden() {
        let dir = TempDir::new("edit");
        let folder = dir.path();
        let allowed = allowing(&folder);

        write(&allowed, &folder, "doc.txt", b"one");
        let before = scan(&allowed, &folder)[0].hash.clone();

        // A hidden file is skipped by the scan.
        std::fs::write(PathBuf::from(&folder).join(".hidden"), b"x").unwrap();
        // Editing the file changes its hash — the reconcile signal.
        write(&allowed, &folder, "doc.txt", b"two");

        let files = scan(&allowed, &folder);
        assert_eq!(files.len(), 1, "the hidden file is not listed");
        assert_ne!(files[0].hash, before, "an edit changes the hash");
    }

    #[test]
    fn remove_is_idempotent() {
        let dir = TempDir::new("remove");
        let folder = dir.path();
        let allowed = allowing(&folder);
        write(&allowed, &folder, "gone.txt", b"x");
        let resolved = resolve(&allowed, &folder, "gone.txt").unwrap();
        std::fs::remove_file(&resolved).unwrap();
        assert!(scan(&allowed, &folder).is_empty());
        // Removing a file that is already gone is a no-op, not an error.
        assert!(
            matches!(std::fs::remove_file(&resolved), Err(e) if e.kind() == std::io::ErrorKind::NotFound)
        );
    }

    #[test]
    fn resolve_rejects_traversal_absolute_and_disallowed_folder() {
        let dir = TempDir::new("resolve");
        let folder = dir.path();
        let allowed = allowing(&folder);

        // Traversal and absolute paths are rejected.
        assert!(resolve(&allowed, &folder, "../escape.txt").is_err());
        assert!(resolve(&allowed, &folder, "a/../../escape.txt").is_err());
        assert!(resolve(&allowed, &folder, "/etc/passwd").is_err());
        // A folder the app never allowed is rejected outright, even with a benign
        // path — the caller can't point FS access at an arbitrary directory.
        assert!(resolve(&allowed, "/", "etc/passwd").is_err());
        assert!(resolve(&AllowedFolders::default(), &folder, "a.txt").is_err());
        // An ordinary nested path under the allowed folder resolves.
        let ok = resolve(&allowed, &folder, "sub/doc.txt").unwrap();
        assert!(ok.starts_with(dir.0.canonicalize().unwrap()));
    }

    // A symlink at the final component is rejected even when it points outside the
    // folder — `fs::write` would otherwise follow it and write out of bounds. Unix
    // only (symlink creation differs on Windows; the check itself is cross-plat).
    #[cfg(unix)]
    #[test]
    fn resolve_rejects_symlink_final_component() {
        let dir = TempDir::new("symlink");
        let folder = dir.path();
        let allowed = allowing(&folder);

        // A dangling symlink (target doesn't exist) inside the folder, pointing
        // out of it — the dangerous case `exists()` would miss.
        let link = PathBuf::from(&folder).join("escape.txt");
        std::os::unix::fs::symlink("/tmp/nvisy-outside-target", &link).unwrap();
        assert!(
            resolve(&allowed, &folder, "escape.txt").is_err(),
            "a symlink at the final component must be refused"
        );
    }
}
