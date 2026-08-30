//! Commands the web layer invokes on the Rust shell.

use tauri::{AppHandle, Manager, Runtime};

use crate::auth::AuthState;
use crate::files::{self, FileFilter, PickedFile};
use crate::spotlight;
use crate::tray::{self, TrayLabels};

/// Push localized tray-menu labels resolved from the web layer's i18n catalog.
/// Called once the frontend boots and again whenever the user switches language,
/// so the tray always speaks the app's chosen language.
#[tauri::command]
pub fn set_tray_labels<R: Runtime>(app: AppHandle<R>, labels: TrayLabels) {
    tray::apply_labels(&app, labels);
}

/// Report whether the user is signed in, so the shell can make window decisions
/// (chiefly: don't summon the auth-only spotlight launcher when signed out).
/// Pushed by the web layer whenever auth state changes.
#[tauri::command]
pub fn set_authed<R: Runtime>(app: AppHandle<R>, authed: bool) {
    app.state::<AuthState>().set(authed);
}

/// Toggle the spotlight launcher. Exposed so the frontend can offer an in-app
/// affordance to open it, mirroring the tray item and the global hotkey.
#[tauri::command]
pub fn toggle_spotlight<R: Runtime>(app: AppHandle<R>) {
    spotlight::toggle(&app);
}

/// Hide the spotlight launcher — the frontend calls this to dismiss itself (e.g.
/// on Esc, or after handing a request off to the main window).
#[tauri::command]
pub fn hide_spotlight<R: Runtime>(app: AppHandle<R>) {
    spotlight::hide(&app);
}

/// Open the main window and dismiss the spotlight launcher — the "Open the app"
/// affordance. Reveals (and focuses) the main window first, then hides the
/// launcher so it doesn't linger in front of it.
#[tauri::command]
pub fn open_main_window<R: Runtime>(app: AppHandle<R>) {
    tray::show_main_window(&app);
    spotlight::hide(&app);
}

/// Open a native file picker and return the chosen files' names and bytes. The
/// frontend's file bridge wraps them back into `File`s for the upload pipeline.
/// An empty result means the user cancelled.
#[tauri::command]
pub async fn open_files<R: Runtime>(
    app: AppHandle<R>,
    filters: Vec<FileFilter>,
) -> Result<Vec<PickedFile>, String> {
    files::open_files(&app, filters).await
}

/// Publish the workspace's effective upload cap so the Rust drop handler can
/// skip an oversized file by its metadata before reading it. `None` = no cap.
#[tauri::command]
pub fn set_drop_limit<R: Runtime>(app: AppHandle<R>, max_bytes: Option<u64>) {
    files::set_drop_limit(&app, max_bytes);
}

/// Save bytes to a path chosen via a native save panel, seeded with
/// `suggested_name`. Returns `false` if the user cancelled.
#[tauri::command]
pub async fn save_file<R: Runtime>(
    app: AppHandle<R>,
    suggested_name: String,
    data: Vec<u8>,
) -> Result<bool, String> {
    files::save_file(&app, suggested_name, data).await
}
