//! Native file I/O behind the web layer's file bridge.
//!
//! The shared UI ingests documents and saves redacted output through a host
//! seam (`useFileBridge`). On the web that seam is unset and the browser's own
//! `<input>` / anchor-download handle it; on desktop these fill it with the real
//! Finder open/save panels and OS drag-drop. Everything touching the filesystem
//! runs in the Rust process, so the webview never needs filesystem scope:
//!
//! - Open/save go through the native dialog; the user's pick is the only grant.
//! - Drag-drop is handled entirely in Rust (see [`on_window_event`]) — the paths
//!   come from the OS drop event and are read here, then the files are *emitted*
//!   to the frontend. The webview never supplies a path to read, so there is no
//!   command it could call to read an arbitrary file.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, DragDropEvent, Emitter, Manager, Runtime, WindowEvent};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tokio::sync::oneshot;

/// Event name the drop handler emits picked files on; the frontend listens for
/// it instead of invoking a read command.
pub const FILES_DROPPED_EVENT: &str = "files-dropped";

/// The workspace's effective per-file upload cap, pushed by the frontend so the
/// drop handler can skip an oversized file by its metadata before reading it.
/// `None` (the default, and when no server cap applies) reads every file.
#[derive(Default)]
pub struct DropLimit(Mutex<Option<u64>>);

impl DropLimit {
    fn get(&self) -> Option<u64> {
        self.0.lock().ok().and_then(|guard| *guard)
    }

    fn set(&self, max_bytes: Option<u64>) {
        if let Ok(mut guard) = self.0.lock() {
            *guard = max_bytes;
        }
    }
}

/// Update the stored drop size cap (invoked by the `set_drop_limit` command).
pub fn set_drop_limit<R: Runtime>(app: &AppHandle<R>, max_bytes: Option<u64>) {
    app.state::<DropLimit>().set(max_bytes);
}

/// A file the user picked, delivered to the webview as its name plus raw bytes
/// (which the frontend wraps back into a `File` for the upload pipeline).
#[derive(Clone, Serialize)]
pub struct PickedFile {
    /// The file's base name, e.g. `contract.docx`.
    pub name: String,
    /// The file's contents.
    pub data: Vec<u8>,
}

/// An extension filter for the open panel, e.g. `{ name: "Documents",
/// extensions: ["docx", "pdf"] }`. Built by the frontend from the shared
/// accepted-extensions list so both hosts enforce the same allowlist.
#[derive(Deserialize)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

/// Show a native open panel and read every chosen file. Returns an empty vec if
/// the user cancels. Errors surface a read failure (e.g. a file vanished between
/// pick and read) to the caller.
pub async fn open_files<R: Runtime>(
    app: &AppHandle<R>,
    filters: Vec<FileFilter>,
) -> Result<Vec<PickedFile>, String> {
    let mut builder = app.dialog().file();
    for filter in &filters {
        let exts: Vec<&str> = filter.extensions.iter().map(String::as_str).collect();
        builder = builder.add_filter(&filter.name, &exts);
    }

    let paths = pick_files(builder).await;
    let Some(paths) = paths else {
        return Ok(Vec::new());
    };

    let mut files = Vec::with_capacity(paths.len());
    for path in paths {
        files.push(read_file(&into_path(path)?)?);
    }
    Ok(files)
}

/// Handle an OS drag-drop on a window: read the dropped files in Rust and emit
/// them to the frontend as [`FILES_DROPPED_EVENT`]. Wire this as (part of) the
/// window's event handler.
///
/// The paths come straight from the OS drop event — the webview never supplies
/// them — so this is the only path by which dropped bytes reach the frontend,
/// and there is no arbitrary-read command to abuse. Reading runs on a blocking
/// thread so a large drop doesn't stall the UI thread the event fires on.
pub fn on_window_event<R: Runtime>(window: &tauri::WebviewWindow<R>, event: &WindowEvent) {
    let WindowEvent::DragDrop(DragDropEvent::Drop { paths, .. }) = event else {
        return;
    };
    if paths.is_empty() {
        return;
    }

    let app = window.app_handle().clone();
    let paths = paths.clone();
    let max_bytes = app.state::<DropLimit>().get();

    tauri::async_runtime::spawn_blocking(move || {
        let files = read_files(paths, max_bytes);
        if !files.is_empty() {
            if let Err(error) = app.emit(FILES_DROPPED_EVENT, files) {
                log::warn!("failed to emit dropped files: {error}");
            }
        }
    });
}

/// Read the given dropped paths into `PickedFile`s. A path that isn't a readable
/// file — a dropped folder, or one that vanished between the drop and the read —
/// is skipped rather than failing the whole drop, so the other dropped files
/// still come through. The frontend's own allowlist then filters by extension.
///
/// `max_bytes` is the workspace's effective per-file upload cap (when the server
/// publishes one): a file larger than it is skipped *by its metadata*, before
/// its bytes are read — so an oversized drop never gets pulled into memory.
fn read_files(paths: Vec<PathBuf>, max_bytes: Option<u64>) -> Vec<PickedFile> {
    paths
        .iter()
        .filter(|path| path.is_file())
        .filter(|path| within_limit(path, max_bytes))
        .filter_map(|path| match read_file(path) {
            Ok(file) => Some(file),
            Err(error) => {
                log::warn!("skipping dropped file {}: {error}", path.display());
                None
            }
        })
        .collect()
}

/// Whether a path is within the cap. A file whose size can't be read is let
/// through (the read step handles a genuine failure); only a known-too-large
/// file is skipped here.
fn within_limit(path: &Path, max_bytes: Option<u64>) -> bool {
    let Some(max) = max_bytes else {
        return true;
    };
    match std::fs::metadata(path) {
        Ok(meta) if meta.len() > max => {
            log::warn!(
                "skipping dropped file {}: {} bytes exceeds cap {max}",
                path.display(),
                meta.len(),
            );
            false
        }
        _ => true,
    }
}

/// Show a native save panel seeded with `suggested_name` and write `data` to the
/// chosen path. Returns `false` if the user cancels.
pub async fn save_file<R: Runtime>(
    app: &AppHandle<R>,
    suggested_name: String,
    data: Vec<u8>,
) -> Result<bool, String> {
    let path = pick_save_path(app.dialog().file().set_file_name(&suggested_name)).await;
    let Some(path) = path else {
        return Ok(false);
    };

    std::fs::write(into_path(path)?, &data).map_err(|error| error.to_string())?;
    Ok(true)
}

/// Bridge the dialog's callback-style `pick_files` to an awaitable result.
async fn pick_files<R: Runtime>(
    builder: tauri_plugin_dialog::FileDialogBuilder<R>,
) -> Option<Vec<FilePath>> {
    let (tx, rx) = oneshot::channel();
    builder.pick_files(move |paths| {
        let _ = tx.send(paths);
    });
    rx.await.ok().flatten()
}

/// Bridge the dialog's callback-style `save_file` to an awaitable result.
async fn pick_save_path<R: Runtime>(
    builder: tauri_plugin_dialog::FileDialogBuilder<R>,
) -> Option<FilePath> {
    let (tx, rx) = oneshot::channel();
    builder.save_file(move |path| {
        let _ = tx.send(path);
    });
    rx.await.ok().flatten()
}

/// Resolve a dialog `FilePath` to a real path. The panels always return a path
/// (never a bare URI), so a missing path is an internal error, not a user one.
fn into_path(path: FilePath) -> Result<PathBuf, String> {
    path.into_path()
        .map_err(|error| format!("unexpected non-path file selection: {error}"))
}

/// Read one picked file into a `PickedFile`, naming it by its base name.
fn read_file(path: &Path) -> Result<PickedFile, String> {
    let data = std::fs::read(path).map_err(|error| error.to_string())?;
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("file")
        .to_owned();
    Ok(PickedFile { name, data })
}
