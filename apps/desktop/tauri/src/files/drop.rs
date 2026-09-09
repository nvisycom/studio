//! OS drag-drop: read dropped files in Rust and emit them to the frontend.
//!
//! The paths come straight from the OS drop event — the webview never supplies
//! them — so this is the only path by which dropped bytes reach the frontend,
//! and there is no arbitrary-read command to abuse. Reading runs on a blocking
//! thread so a large drop doesn't stall the UI thread the event fires on.

use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, DragDropEvent, Emitter, Manager, Runtime, WindowEvent};

use super::dialog::{PickedFile, read_file, within_limit};

/// Event name the drop handler emits picked files on; the frontend listens for
/// it instead of invoking a read command.
pub const FILES_DROPPED_EVENT: &str = "files-dropped";

/// The workspace's effective per-file upload cap, pushed by the frontend so the
/// drop handler can skip an oversized file by its metadata before reading it.
/// `None` (the default, and when no server cap applies) reads every file.
#[derive(Default)]
pub struct DropLimit(Mutex<Option<u64>>);

impl DropLimit {
    /// The current effective per-file upload cap in bytes, if any. Shared with
    /// the watched-folder path so it applies the same limit as native drops.
    pub(crate) fn get(&self) -> Option<u64> {
        self.0.lock().ok().and_then(|guard| *guard)
    }

    fn set(&self, max_bytes: Option<u64>) {
        if let Ok(mut guard) = self.0.lock() {
            *guard = max_bytes;
        }
    }
}

/// Update the stored drop size cap (invoked by the `set_drop_limit` command).
pub fn store_limit<R: Runtime>(app: &AppHandle<R>, max_bytes: Option<u64>) {
    app.state::<DropLimit>().set(max_bytes);
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
        if !files.is_empty()
            && let Err(error) = app.emit(FILES_DROPPED_EVENT, files)
        {
            log::warn!("failed to emit dropped files: {error}");
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
        // Cheap metadata pre-check to skip obviously-oversized files; the read
        // itself also enforces the cap, closing the metadata->read race.
        .filter(|path| within_limit(path, max_bytes))
        .filter_map(|path| match read_file(path, max_bytes) {
            Ok(file) => Some(file),
            Err(error) => {
                log::warn!("skipping dropped file {}: {error}", path.display());
                None
            }
        })
        .collect()
}
