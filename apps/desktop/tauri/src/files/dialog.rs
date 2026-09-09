//! Native open/save/folder panels and the filesystem reads behind them.
//!
//! Open and save go through the OS dialog; the user's pick is the only grant, so
//! the webview never needs filesystem scope. The read helpers here are shared
//! with the drag-drop and watched-folder paths, which read the same way.

use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Runtime};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tokio::sync::oneshot;

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
pub async fn pick_open_files<R: Runtime>(
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
        // The open picker applies no explicit cap (the upload pipeline enforces
        // the workspace/server limits); read unbounded.
        files.push(read_file(&into_path(path)?, None)?);
    }
    Ok(files)
}

/// Show a native save panel seeded with `suggested_name` and write `data` to the
/// chosen path. Returns `false` if the user cancels.
pub async fn write_save_file<R: Runtime>(
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

/// Show a native folder picker and return the chosen directory, or `None` if the
/// user cancelled. Used to choose the watched folder.
pub async fn pick_folder<R: Runtime>(app: &AppHandle<R>) -> Result<Option<PathBuf>, String> {
    let (tx, rx) = oneshot::channel();
    app.dialog().file().pick_folder(move |path| {
        let _ = tx.send(path);
    });
    match rx.await.ok().flatten() {
        Some(path) => Ok(Some(into_path(path)?)),
        None => Ok(None),
    }
}

/// Resolve a dialog `FilePath` to a real path. The panels always return a path
/// (never a bare URI), so a missing path is an internal error, not a user one.
fn into_path(path: FilePath) -> Result<PathBuf, String> {
    path.into_path()
        .map_err(|error| format!("unexpected non-path file selection: {error}"))
}

/// Whether a path is within the cap. A file whose size can't be read is let
/// through (the read step handles a genuine failure); only a known-too-large
/// file is skipped here. Shared by the native-drop and watched-folder paths, so
/// an oversized file is rejected by its metadata before it's read into memory.
pub(crate) fn within_limit(path: &Path, max_bytes: Option<u64>) -> bool {
    let Some(max) = max_bytes else {
        return true;
    };
    match std::fs::metadata(path) {
        Ok(meta) if meta.len() > max => {
            log::warn!(
                "skipping file {}: {} bytes exceeds cap {max}",
                path.display(),
                meta.len(),
            );
            false
        }
        _ => true,
    }
}

/// Read one file into a `PickedFile`, naming it by its base name. Shared with
/// the watched-folder module, which reads newly-seen files the same way.
///
/// `max_bytes` bounds the read itself (not just a prior metadata check): the file
/// is streamed through a limited reader and the read fails if it would exceed the
/// cap, so a file that grew or was replaced after its size was checked can't load
/// more than the cap into memory. `None` reads without a bound.
pub(crate) fn read_file(path: &Path, max_bytes: Option<u64>) -> Result<PickedFile, String> {
    use std::io::Read;

    let file = std::fs::File::open(path).map_err(|error| error.to_string())?;
    let data = match max_bytes {
        // Read one byte past the cap so an at-limit file passes but a larger one
        // is caught, without trusting the (racy) metadata size.
        Some(max) => {
            let mut buf = Vec::new();
            file.take(max.saturating_add(1))
                .read_to_end(&mut buf)
                .map_err(|error| error.to_string())?;
            if buf.len() as u64 > max {
                return Err(format!("{} exceeds cap {max} bytes", path.display()));
            }
            buf
        }
        None => {
            let mut buf = Vec::new();
            let mut file = file;
            file.read_to_end(&mut buf)
                .map_err(|error| error.to_string())?;
            buf
        }
    };
    let name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("file")
        .to_owned();
    Ok(PickedFile { name, data })
}
