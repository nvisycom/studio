//! Commands the web layer invokes on the Rust shell.

use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_notification::NotificationExt;

use crate::auth::AuthState;
use crate::files::{self, FileFilter, PickedFile};
use crate::settings::{self, WatchConfig};
use crate::tray::{self, TrayLabels};
use crate::{spotlight, watch};

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

/// Reflect the number of in-flight background jobs on the tray (a count next to
/// the menu-bar icon, plus a localized `tooltip` on hover). Pushed by the web
/// layer as detections start and finish.
/// Reflect the account's unread-notification count on the tray (a badge next to
/// the menu-bar icon, plus a localized `tooltip` on hover). Pushed by the web
/// layer from the live notification stream.
#[tauri::command]
pub fn set_badge_count<R: Runtime>(app: AppHandle<R>, count: u32, tooltip: Option<String>) {
    tray::set_badge_count(&app, count, tooltip);
}

/// Whether native notifications are enabled (the device-scoped preference behind
/// the tray toggle and the Desktop notification channel).
#[tauri::command]
pub fn notifications_enabled<R: Runtime>(app: AppHandle<R>) -> bool {
    settings::notifications_enabled(&app)
}

/// Set the notifications preference. Persists it and keeps the tray menu item in
/// sync (via `tray`), so the settings toggle and the tray toggle agree.
#[tauri::command]
pub fn set_notifications_enabled<R: Runtime>(app: AppHandle<R>, enabled: bool) {
    tray::set_notifications_enabled(&app, enabled);
}

/// Fire a native notification, mirroring an in-app one. A no-op when
/// notifications are disabled, or when the main window is focused (the user is
/// already looking at the in-app notification) — so the web layer can always
/// call it.
#[tauri::command]
pub fn notify<R: Runtime>(app: AppHandle<R>, title: String, body: String) {
    if !settings::notifications_enabled(&app) || tray::main_window_focused(&app) {
        return;
    }
    let _ = app.notification().builder().title(title).body(body).show();
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
    let Some(folder) = files::pick_folder(&app).await? else {
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

/// Re-emit the watched folder's current backlog. The frontend calls this once
/// authenticated, to upload files that were present before it could receive them
/// (a restored watch on startup arms before login).
#[tauri::command]
pub fn scan_watch_folder<R: Runtime>(app: AppHandle<R>) {
    watch::scan(&app);
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
