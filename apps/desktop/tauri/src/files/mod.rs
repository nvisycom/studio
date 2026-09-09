//! Native file I/O behind the web layer's file bridge.
//!
//! The shared UI ingests documents and saves redacted output through a host
//! seam (`useFileBridge`). On the web that seam is unset and the browser's own
//! `<input>` / anchor-download handle it; on desktop the commands here fill it
//! with the real Finder open/save panels (`dialog`), OS drag-drop (`drop`), and
//! a watched auto-upload folder (`watch`). Everything touching the filesystem
//! runs in the Rust process, so the webview never needs filesystem scope.

mod dialog;
mod drop;
pub mod watch;

pub use drop::{on_window_event, DropLimit};

use tauri::{AppHandle, Runtime};

use dialog::{FileFilter, PickedFile};
use watch::WatchConfig;

/// Open a native file picker and return the chosen files' names and bytes. The
/// frontend's file bridge wraps them back into `File`s for the upload pipeline.
/// An empty result means the user cancelled.
#[tauri::command]
pub async fn open_files<R: Runtime>(
    app: AppHandle<R>,
    filters: Vec<FileFilter>,
) -> Result<Vec<PickedFile>, String> {
    dialog::pick_open_files(&app, filters).await
}

/// Save bytes to a path chosen via a native save panel, seeded with
/// `suggested_name`. Returns `false` if the user cancelled.
#[tauri::command]
pub async fn save_file<R: Runtime>(
    app: AppHandle<R>,
    suggested_name: String,
    data: Vec<u8>,
) -> Result<bool, String> {
    dialog::write_save_file(&app, suggested_name, data).await
}

/// Publish the workspace's effective upload cap so the Rust drop handler can
/// skip an oversized file by its metadata before reading it. `None` = no cap.
#[tauri::command]
pub fn set_drop_limit<R: Runtime>(app: AppHandle<R>, max_bytes: Option<u64>) {
    drop::store_limit(&app, max_bytes);
}

/// Prompt for a folder to watch, auto-uploading its files to `workspace_slug`
/// (accepting only the given extensions, lower-case, no dot). Emits the existing
/// backlog and then new arrivals as `folder-file` events; persists the config.
/// Returns the chosen config, or null if the user cancelled the picker.
#[tauri::command]
pub async fn set_watch_folder<R: Runtime>(
    app: AppHandle<R>,
    workspace_slug: String,
    extensions: Vec<String>,
) -> Result<Option<WatchConfig>, String> {
    let Some(folder) = dialog::pick_folder(&app).await? else {
        return Ok(None);
    };
    let folder = folder.to_string_lossy().into_owned();
    // Fresh pick: emit the backlog now — the frontend is authed and listening.
    watch::set_folder(
        &app,
        folder.clone(),
        workspace_slug.clone(),
        extensions,
        true,
    )?;
    Ok(Some(WatchConfig {
        folder,
        workspace_slug,
    }))
}

/// Re-emit the watched folder's current backlog and re-arm the watcher with the
/// accepted-extension allowlist (`extensions`, lower-case, no dot). The frontend
/// calls this once authenticated, to upload files that were present before it
/// could receive them (a restored watch on startup arms before login), and
/// supplies the allowlist so disallowed files are skipped before being read.
#[tauri::command]
pub fn scan_watch_folder<R: Runtime>(app: AppHandle<R>, extensions: Vec<String>) {
    watch::scan(&app, extensions);
}

/// The current watched-folder config, or null if none is set.
#[tauri::command]
pub fn watch_folder<R: Runtime>(app: AppHandle<R>) -> Option<WatchConfig> {
    watch::config(&app)
}

/// Stop watching and clear the persisted watched-folder config.
#[tauri::command]
pub fn clear_watch_folder<R: Runtime>(app: AppHandle<R>) {
    watch::clear(&app);
}
