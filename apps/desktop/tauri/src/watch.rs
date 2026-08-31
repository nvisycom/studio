//! Watched folder: auto-upload files that appear in a chosen directory.
//!
//! The user points the app at an inbox folder bound to a workspace. This module
//! watches it (the existing backlog on start, then new arrivals), reads each
//! supported file in Rust, and emits it to the frontend as [`FOLDER_FILE_EVENT`]
//! — the frontend uploads it to the bound workspace through the SDK client (the
//! Rust side has no auth/workspace context). Only the folder path and workspace
//! binding cross into Rust; the upload itself stays in the web layer.
//!
//! Like the drag-drop path, reading happens in Rust so the webview needs no
//! filesystem scope.

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;

use notify::{EventKind, RecursiveMode};
use notify_debouncer_full::{new_debouncer, DebounceEventResult, Debouncer, RecommendedCache};
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::files::{read_file, PickedFile};
use crate::settings::{self, WatchConfig};

/// Event carrying one file found in the watched folder to the frontend.
pub const FOLDER_FILE_EVENT: &str = "folder-file";

/// How long to coalesce filesystem events, so a single file write (which fires
/// several create/modify events) is handled once, after it settles.
const DEBOUNCE: Duration = Duration::from_millis(750);

/// The active watcher plus the config it was started with. Held in app state so
/// setting a new folder replaces the previous watcher (dropping it stops it).
#[derive(Default)]
pub struct WatchState(Mutex<Option<Active>>);

struct Active {
    // Kept alive to keep watching; dropping it stops the watch.
    _debouncer: Debouncer<notify::RecommendedWatcher, RecommendedCache>,
}

/// A file surfaced from the watched folder, sent to the frontend to upload.
#[derive(Clone, Serialize)]
struct FolderFile {
    /// The file's base name.
    name: String,
    /// The file's contents.
    data: Vec<u8>,
    /// The workspace the frontend should upload it to (the folder's binding).
    workspace_slug: String,
}

/// Start (or restart) watching `folder`, binding auto-uploads to `workspace_slug`
/// and accepting only files whose extension is in `extensions` (lower-case, no
/// dot). Persists the config and watches for new arrivals; when `emit_backlog_now`
/// is set, also emits the existing backlog (a fresh pick, where the frontend is
/// ready to receive it). Returns an error if the folder can't be watched.
pub fn set_folder<R: Runtime>(
    app: &AppHandle<R>,
    folder: String,
    workspace_slug: String,
    extensions: Vec<String>,
    emit_backlog_now: bool,
) -> Result<(), String> {
    let path = PathBuf::from(&folder);
    if !path.is_dir() {
        return Err(format!("not a folder: {folder}"));
    }
    let accepted: HashSet<String> = extensions.into_iter().collect();

    // Watcher callback: on any create/modify, read the newly-present supported
    // files under the changed paths and emit them.
    let handle = app.clone();
    let slug = workspace_slug.clone();
    let exts = accepted.clone();
    let mut debouncer = new_debouncer(DEBOUNCE, None, move |result: DebounceEventResult| {
        let events = match result {
            Ok(events) => events,
            Err(errors) => {
                for error in errors {
                    log::warn!("watch error: {error}");
                }
                return;
            }
        };
        for event in events {
            if !matches!(event.kind, EventKind::Create(_) | EventKind::Modify(_)) {
                continue;
            }
            for path in &event.paths {
                emit_file(&handle, path, &slug, &exts);
            }
        }
    })
    .map_err(|error| format!("failed to start watcher: {error}"))?;

    debouncer
        .watch(&path, RecursiveMode::Recursive)
        .map_err(|error| format!("failed to watch folder: {error}"))?;

    // Replace any previous watcher (dropping it stops it) and persist the config.
    *state(app).0.lock().map_err(lock_err)? = Some(Active {
        _debouncer: debouncer,
    });
    let config = WatchConfig {
        folder,
        workspace_slug: workspace_slug.clone(),
    };
    settings::set_watch(app, Some(&config));

    // Emit the existing backlog so a freshly-set folder catches up. (On a fresh
    // pick the frontend is already authed to receive+upload these; the restore
    // path skips this and lets the frontend `scan` once it's ready — see below.)
    if emit_backlog_now {
        emit_backlog(app, &path, &workspace_slug, &accepted);
    }
    Ok(())
}

/// Stop watching and clear the persisted config.
pub fn clear<R: Runtime>(app: &AppHandle<R>) {
    if let Ok(mut guard) = state(app).0.lock() {
        *guard = None; // dropping the debouncer stops the watch
    }
    settings::set_watch(app, None);
}

/// The persisted watched-folder config, if any.
pub fn config<R: Runtime>(app: &AppHandle<R>) -> Option<WatchConfig> {
    settings::watch(app)
}

/// Re-emit the current backlog of the watched folder. The frontend calls this
/// once it's authenticated (the restore below only re-arms the watcher — it
/// can't upload the backlog itself, since the client isn't ready at boot).
pub fn scan<R: Runtime>(app: &AppHandle<R>) {
    let Some(config) = settings::watch(app) else {
        return;
    };
    let path = PathBuf::from(&config.folder);
    // No extension allowlist here (the frontend filters on receive), matching how
    // the restored watcher was armed.
    emit_backlog(app, &path, &config.workspace_slug, &HashSet::new());
}

/// Restore the watcher from the persisted config on startup (best-effort). Only
/// re-arms the watcher for *new* arrivals; the existing backlog is left for the
/// frontend to request via `scan` once it can upload (the client isn't ready at
/// boot). Accepts every extension — the frontend's allowlist filters on receive.
pub fn restore<R: Runtime>(app: &AppHandle<R>) {
    let Some(config) = settings::watch(app) else {
        return;
    };
    if let Err(error) = set_folder(app, config.folder, config.workspace_slug, Vec::new(), false) {
        log::warn!("failed to restore watched folder: {error}");
    }
}

/// Read and emit one file if it's a supported, readable regular file.
fn emit_file<R: Runtime>(
    app: &AppHandle<R>,
    path: &Path,
    workspace_slug: &str,
    accepted: &HashSet<String>,
) {
    if !path.is_file() || !is_accepted(path, accepted) {
        return;
    }
    match read_file(path) {
        Ok(PickedFile { name, data }) => {
            let file = FolderFile {
                name,
                data,
                workspace_slug: workspace_slug.to_owned(),
            };
            if let Err(error) = app.emit(FOLDER_FILE_EVENT, file) {
                log::warn!("failed to emit watched file: {error}");
            }
        }
        Err(error) => log::warn!("skipping watched file {}: {error}", path.display()),
    }
}

/// Emit every supported file already under the folder, descending into
/// subfolders (matching the recursive watch). Traversal is iterative (an
/// explicit stack, not recursion) so a deep tree can't overflow the call stack,
/// and symlinked directories are skipped so a symlink cycle can't loop forever.
fn emit_backlog<R: Runtime>(
    app: &AppHandle<R>,
    folder: &Path,
    workspace_slug: &str,
    accepted: &HashSet<String>,
) {
    let mut dirs = vec![folder.to_path_buf()];
    while let Some(dir) = dirs.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            // `file_type` doesn't follow symlinks, so a symlinked directory
            // reports as a symlink (not a dir) and is neither descended into nor
            // uploaded — no cycles.
            match entry.file_type() {
                Ok(ft) if ft.is_dir() => dirs.push(path),
                Ok(ft) if ft.is_file() => emit_file(app, &path, workspace_slug, accepted),
                _ => {}
            }
        }
    }
}

/// Whether a path's extension is accepted. An empty allowlist accepts every
/// extension (used on restore; the frontend's own allowlist then filters).
fn is_accepted(path: &Path, accepted: &HashSet<String>) -> bool {
    if accepted.is_empty() {
        return true;
    }
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| accepted.contains(&ext.to_ascii_lowercase()))
        .unwrap_or(false)
}

fn state<R: Runtime>(app: &AppHandle<R>) -> tauri::State<'_, WatchState> {
    app.state::<WatchState>()
}

fn lock_err<T>(_: std::sync::PoisonError<T>) -> String {
    "watch state lock poisoned".to_owned()
}
