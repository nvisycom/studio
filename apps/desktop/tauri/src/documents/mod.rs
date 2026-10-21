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
//! The caller (the webview) is NOT trusted, so a FS or engine command never
//! takes a folder path from it — it takes the `workspaceId` it is acting on, and
//! Rust resolves that id to its bound folder through [`WorkspaceFolders`]. A
//! folder is bound to a workspace only through a user pick (the native folder
//! panel, `pick_workspace_folder`), and the `id → folder` map is persisted to a
//! file only Rust writes, so it survives a restart without the webview being able
//! to add or repoint a binding. Because authorization is keyed by workspace, one
//! workspace can't reach another's folder, and the persisted workspace record's
//! `folder` field (which the webview writes via `store_upsert`) carries no
//! authority. Every `path` is then resolved under the bound folder and the
//! resolved, canonicalized path is confirmed to stay inside it, so neither a
//! traversal `path` nor a symlink can reach a file outside it. Bytes cross to the
//! webview as a raw `tauri::ipc::Response` (an ArrayBuffer), not a JSON number
//! array — the way Tauri v2 recommends for binary payloads.

use std::collections::{HashMap, HashSet};
use std::path::{Component, Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::ipc::Response;
use tauri::{AppHandle, Manager, Runtime, State};

use crate::files::pick_folder;

/// File under the app data dir that records the workspace→folder bindings. Only
/// Rust writes it (on a bind), so the webview can't add or repoint a binding.
const BINDINGS_FILE: &str = "workspace-folders.json";

/// The authorization layer for folder-backed workspaces: which folder each local
/// workspace is bound to. The FS and engine commands take a `workspaceId` (never
/// a caller-supplied folder) and resolve the bound folder here, so one workspace
/// can't reach another's folder and the persisted workspace record's `folder`
/// field — which the webview writes via `store_upsert` — has no authority.
///
/// A binding is created only through [`bind`](Self::bind), gated on the folder
/// having been picked this session ([`pick_workspace_folder`] records it). The
/// `id → folder` map is persisted to [`BINDINGS_FILE`] and re-seeded at startup
/// ([`WorkspaceFolders::load`]) — that's Rust reading its own file, not a webview
/// bind, so past workspaces work on launch without a re-pick while the webview
/// still cannot introduce a folder it didn't pick.
#[derive(Default)]
pub struct WorkspaceFolders {
    /// `workspaceId → canonical folder`: the authorization map.
    bindings: Mutex<HashMap<String, PathBuf>>,
    /// Canonical folders picked this session — the only folders a webview-issued
    /// bind may name. Not persisted; a bind of a past workspace comes from the
    /// seeded `bindings`, not from here.
    picked: Mutex<HashSet<PathBuf>>,
    /// The persistence file, set once at startup (unset before `load`, as in
    /// tests — then a write is simply not persisted).
    store: OnceLock<PathBuf>,
}

impl WorkspaceFolders {
    /// Seed the bindings from the persisted file and remember it for later
    /// writes. Called once at setup. A missing or unreadable file just means no
    /// workspace is bound yet (first run). Rust wrote this file, so loading it is
    /// trusted — not a webview bind.
    pub fn load<R: Runtime>(&self, app: &AppHandle<R>) {
        let Ok(dir) = app.path().app_data_dir() else {
            return;
        };
        let file = dir.join(BINDINGS_FILE);
        let _ = self.store.set(file.clone());
        let Ok(bytes) = std::fs::read(&file) else {
            return;
        };
        let Ok(saved) = serde_json::from_slice::<HashMap<String, String>>(&bytes) else {
            return;
        };
        if let Ok(mut bindings) = self.bindings.lock() {
            for (id, folder) in saved {
                // Re-canonicalize on load: a folder moved or deleted since it was
                // bound simply drops out (it won't resolve), which is correct.
                if let Ok(path) = std::fs::canonicalize(&folder) {
                    bindings.insert(id, path);
                }
            }
        }
    }

    /// Record a folder as picked this session, so a later [`bind`](Self::bind)
    /// may name it. Only [`pick_workspace_folder`] calls this.
    fn remember_picked(&self, folder: &str) {
        if let Ok(path) = std::fs::canonicalize(folder)
            && let Ok(mut picked) = self.picked.lock()
        {
            picked.insert(path);
        }
    }

    /// Bind `workspace_id` to `folder`, persisting the map. Succeeds only if the
    /// folder was picked this session (or is already this id's binding — an
    /// idempotent re-bind the frontend does on load). The webview can therefore
    /// name a workspace but never bind a folder it didn't pick, nor repoint an
    /// existing binding to a different folder.
    ///
    /// # Errors
    ///
    /// - A string error if the folder can't be canonicalized, or it was neither
    ///   picked this session nor already this workspace's binding.
    fn bind(&self, workspace_id: &str, folder: &str) -> Result<(), String> {
        let path = std::fs::canonicalize(folder).map_err(|err| err.to_string())?;
        let mut bindings = self
            .bindings
            .lock()
            .map_err(|_| "folder bindings unavailable".to_owned())?;

        let already_bound = bindings.get(workspace_id) == Some(&path);
        let picked_now = self
            .picked
            .lock()
            .map(|picked| picked.contains(&path))
            .unwrap_or(false);
        if !already_bound && !picked_now {
            return Err("folder was not picked this session".to_owned());
        }

        if bindings.get(workspace_id) != Some(&path) {
            bindings.insert(workspace_id.to_owned(), path);
            self.persist(&bindings);
        }
        Ok(())
    }

    /// Write the current bindings to the persistence file (best-effort; a failed
    /// write just means a binding isn't remembered across a restart, not a crash).
    fn persist(&self, bindings: &HashMap<String, PathBuf>) {
        let Some(file) = self.store.get() else {
            return;
        };
        let saved: HashMap<&str, String> = bindings
            .iter()
            .map(|(id, path)| (id.as_str(), path.to_string_lossy().into_owned()))
            .collect();
        if let Ok(json) = serde_json::to_vec(&saved) {
            if let Some(parent) = file.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = std::fs::write(file, json);
        }
    }

    /// The canonical folder bound to `workspace_id`, or `None` if unbound.
    fn folder_of(&self, workspace_id: &str) -> Option<PathBuf> {
        self.bindings.lock().ok()?.get(workspace_id).cloned()
    }

    /// Drop `workspace_id`'s binding (on workspace delete), persisting the change
    /// so the map doesn't keep a deleted workspace's folder.
    fn unbind(&self, workspace_id: &str) {
        if let Ok(mut bindings) = self.bindings.lock()
            && bindings.remove(workspace_id).is_some()
        {
            self.persist(&bindings);
        }
    }

    /// Resolve `path` under `workspace_id`'s bound folder to an absolute,
    /// contained path. The engine commands use this to read a document from disk.
    ///
    /// # Errors
    ///
    /// - A string error if the workspace is not bound to a folder, or `path`
    ///   escapes it.
    pub fn resolve_path(&self, workspace_id: &str, path: &str) -> Result<PathBuf, String> {
        resolve(self, workspace_id, path)
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
/// absolute path, or `None` if the user cancelled. The chosen folder is recorded
/// as picked-this-session, so [`bind_workspace_folder`] may bind it to the new
/// workspace's id; it is not yet bound to anything (no id exists yet).
#[tauri::command]
pub async fn pick_workspace_folder<R: Runtime>(
    app: AppHandle<R>,
    folders: State<'_, WorkspaceFolders>,
) -> Result<Option<String>, String> {
    let picked = pick_folder(&app).await?;
    if let Some(path) = &picked {
        folders.remember_picked(&path.to_string_lossy());
    }
    Ok(picked.map(|path| path.to_string_lossy().into_owned()))
}

/// Bind a workspace id to its folder. The frontend calls this when creating a
/// local workspace (with the folder just picked) and again when loading one, so
/// authorization is keyed by workspace id for every later command. Binding only
/// succeeds for a folder picked this session, or one already bound to this id —
/// the webview can't bind a folder it didn't pick, nor repoint a binding.
#[tauri::command]
pub fn bind_workspace_folder(
    folders: State<'_, WorkspaceFolders>,
    workspace_id: String,
    folder: String,
) -> Result<(), String> {
    folders.bind(&workspace_id, &folder)
}

/// Drop a workspace's folder binding when the workspace is deleted, so the
/// persisted map doesn't keep a stale folder. A no-op if it wasn't bound.
#[tauri::command]
pub fn unbind_workspace_folder(folders: State<'_, WorkspaceFolders>, workspace_id: String) {
    folders.unbind(&workspace_id);
}

/// Read one document's bytes from a workspace's folder, as a raw IPC response
/// (an ArrayBuffer on the webview side). `path` is relative to the folder bound
/// to `workspace_id`.
#[tauri::command]
pub fn documents_read(
    folders: State<'_, WorkspaceFolders>,
    workspace_id: String,
    path: String,
) -> Result<Response, String> {
    let resolved = resolve(&folders, &workspace_id, &path)?;
    let bytes = std::fs::read(&resolved).map_err(|err| err.to_string())?;
    Ok(Response::new(bytes))
}

/// Write bytes into a workspace's folder at `path` (relative to the folder bound
/// to `workspace_id`), creating parent directories as needed. Used for an upload
/// and for a redaction's sibling output. The bytes arrive as a plain argument,
/// matching the existing `save_file` command — writes are occasional, so the read
/// path's raw-response optimization isn't needed here.
#[tauri::command]
pub fn documents_write(
    folders: State<'_, WorkspaceFolders>,
    workspace_id: String,
    path: String,
    data: Vec<u8>,
) -> Result<(), String> {
    let resolved = resolve(&folders, &workspace_id, &path)?;
    if let Some(parent) = resolved.parent() {
        std::fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    std::fs::write(&resolved, &data).map_err(|err| err.to_string())
}

/// Delete one document from a workspace's folder. A no-op if it is already gone.
#[tauri::command]
pub fn documents_remove(
    folders: State<'_, WorkspaceFolders>,
    workspace_id: String,
    path: String,
) -> Result<(), String> {
    let resolved = resolve(&folders, &workspace_id, &path)?;
    match std::fs::remove_file(&resolved) {
        Ok(()) => Ok(()),
        Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(err) => Err(err.to_string()),
    }
}

/// Scan a workspace's bound folder, returning every regular file with its
/// relative path, size, and content hash. The frontend reconciles this against
/// the index — matching renames by hash, detecting edits as a changed hash, and
/// dropping records whose file is gone. Hidden files (dot-prefixed) are skipped.
/// A file that can't be read (a permission error, a Windows lock) is skipped,
/// not fatal, so one bad file doesn't blank the whole list.
#[tauri::command]
pub fn documents_scan(
    folders: State<'_, WorkspaceFolders>,
    workspace_id: String,
) -> Result<Vec<ScannedFile>, String> {
    let root = folders
        .folder_of(&workspace_id)
        .ok_or("workspace is not bound to a folder")?;
    if !root.is_dir() {
        return Err(format!(
            "workspace folder is not a directory: {}",
            root.display()
        ));
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

/// Resolve `path` to an absolute path confined to `workspace_id`'s bound folder.
/// The caller supplies the workspace id (not a folder), so the root is whatever
/// Rust bound to that id; `path` must be relative and carry no root or parent
/// (`..`) component (which rules out Windows roots like `\Windows` and `C:\` too,
/// since those parse as a `RootDir`/`Prefix` component, not `Normal`). The joined
/// path is then canonicalized and confirmed to stay under the folder, so a
/// symlink inside the folder can't redirect out either.
fn resolve(folders: &WorkspaceFolders, workspace_id: &str, path: &str) -> Result<PathBuf, String> {
    let root = folders
        .folder_of(workspace_id)
        .ok_or("workspace is not bound to a folder")?;

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

    /// The workspace id the FS helpers bind a folder to.
    const WS: &str = "ws-test";

    /// A `WorkspaceFolders` with `folder` picked-and-bound to [`WS`], as the pick
    /// + bind commands would leave it, for the FS helpers.
    fn bound(folder: &str) -> WorkspaceFolders {
        let folders = WorkspaceFolders::default();
        folders.remember_picked(folder);
        folders.bind(WS, folder).unwrap();
        folders
    }

    /// Write bytes under [`WS`]'s bound folder (the command body, sans `State`).
    fn write(folders: &WorkspaceFolders, path: &str, data: &[u8]) {
        let resolved = resolve(folders, WS, path).unwrap();
        if let Some(parent) = resolved.parent() {
            std::fs::create_dir_all(parent).unwrap();
        }
        std::fs::write(resolved, data).unwrap();
    }

    /// Scan [`WS`]'s bound folder (the command body, sans `State`).
    fn scan(folders: &WorkspaceFolders) -> Vec<ScannedFile> {
        let root = folders.folder_of(WS).unwrap();
        let mut out = Vec::new();
        scan_dir(&root, &root, &mut out).unwrap();
        out
    }

    #[test]
    fn write_scan_read_round_trip() {
        let dir = TempDir::new("round-trip");
        let folders = bound(&dir.path());

        write(&folders, "a.txt", b"hello");
        write(&folders, "sub/b.txt", b"world");

        let mut files = scan(&folders);
        files.sort_by(|a, b| a.path.cmp(&b.path));
        assert_eq!(files.len(), 2);
        assert_eq!(files[0].path, "a.txt");
        assert_eq!(files[0].size, 5);
        // Nested paths are forward-slashed and relative to the folder.
        assert_eq!(files[1].path, "sub/b.txt");
        // The hash is the content's SHA-256.
        assert_eq!(
            files[0].hash,
            hash_file(&resolve(&folders, WS, "a.txt").unwrap())
                .unwrap()
                .1
        );

        // The resolved path reads back the exact bytes.
        let resolved = resolve(&folders, WS, "a.txt").unwrap();
        assert_eq!(std::fs::read(resolved).unwrap(), b"hello");
    }

    #[test]
    fn scan_detects_edit_and_skips_hidden() {
        let dir = TempDir::new("edit");
        let folders = bound(&dir.path());

        write(&folders, "doc.txt", b"one");
        let before = scan(&folders)[0].hash.clone();

        // A hidden file is skipped by the scan.
        std::fs::write(dir.0.join(".hidden"), b"x").unwrap();
        // Editing the file changes its hash — the reconcile signal.
        write(&folders, "doc.txt", b"two");

        let files = scan(&folders);
        assert_eq!(files.len(), 1, "the hidden file is not listed");
        assert_ne!(files[0].hash, before, "an edit changes the hash");
    }

    #[test]
    fn remove_is_idempotent() {
        let dir = TempDir::new("remove");
        let folders = bound(&dir.path());
        write(&folders, "gone.txt", b"x");
        let resolved = resolve(&folders, WS, "gone.txt").unwrap();
        std::fs::remove_file(&resolved).unwrap();
        assert!(scan(&folders).is_empty());
        // Removing a file that is already gone is a no-op, not an error.
        assert!(
            matches!(std::fs::remove_file(&resolved), Err(e) if e.kind() == std::io::ErrorKind::NotFound)
        );
    }

    #[test]
    fn resolve_rejects_traversal_absolute_and_unbound_workspace() {
        let dir = TempDir::new("resolve");
        let folders = bound(&dir.path());

        // Traversal and absolute paths are rejected.
        assert!(resolve(&folders, WS, "../escape.txt").is_err());
        assert!(resolve(&folders, WS, "a/../../escape.txt").is_err());
        assert!(resolve(&folders, WS, "/etc/passwd").is_err());
        // A workspace that was never bound resolves to nothing, even with a benign
        // path — the caller can't point FS access at an arbitrary directory.
        assert!(resolve(&folders, "ws-unknown", "a.txt").is_err());
        assert!(resolve(&WorkspaceFolders::default(), WS, "a.txt").is_err());
        // An ordinary nested path under the bound folder resolves.
        let ok = resolve(&folders, WS, "sub/doc.txt").unwrap();
        assert!(ok.starts_with(dir.0.canonicalize().unwrap()));
    }

    #[test]
    fn bind_requires_a_folder_picked_this_session() {
        let dir = TempDir::new("bind-gate");
        let folders = WorkspaceFolders::default();
        // A folder that was never picked this session can't be bound — this is what
        // stops the webview from binding an arbitrary path like "/".
        assert!(folders.bind(WS, &dir.path()).is_err());
        // Once picked, the bind succeeds and the workspace resolves.
        folders.remember_picked(&dir.path());
        assert!(folders.bind(WS, &dir.path()).is_ok());
        assert!(folders.folder_of(WS).is_some());
    }

    #[test]
    fn a_workspace_cannot_reach_another_workspaces_folder() {
        let a = TempDir::new("ws-a");
        let b = TempDir::new("ws-b");
        let folders = WorkspaceFolders::default();
        folders.remember_picked(&a.path());
        folders.remember_picked(&b.path());
        folders.bind("ws-a", &a.path()).unwrap();
        folders.bind("ws-b", &b.path()).unwrap();
        // Put a file in B; A's id must not be able to resolve into B's folder.
        std::fs::write(b.0.join("secret.txt"), b"x").unwrap();
        let from_a = resolve(&folders, "ws-a", "secret.txt").unwrap();
        // A's resolved path stays under A's folder, so it points at a non-existent
        // file, never B's — authorization is keyed by workspace, not a shared set.
        assert!(from_a.starts_with(a.0.canonicalize().unwrap()));
        assert!(!from_a.exists());
    }

    // A symlink at the final component is rejected even when it points outside the
    // folder — `fs::write` would otherwise follow it and write out of bounds. Unix
    // only (symlink creation differs on Windows; the check itself is cross-plat).
    #[cfg(unix)]
    #[test]
    fn resolve_rejects_symlink_final_component() {
        let dir = TempDir::new("symlink");
        let folders = bound(&dir.path());

        // A dangling symlink (target doesn't exist) inside the folder, pointing
        // out of it — the dangerous case `exists()` would miss.
        let link = dir.0.join("escape.txt");
        std::os::unix::fs::symlink("/tmp/nvisy-outside-target", &link).unwrap();
        assert!(
            resolve(&folders, WS, "escape.txt").is_err(),
            "a symlink at the final component must be refused"
        );
    }
}
