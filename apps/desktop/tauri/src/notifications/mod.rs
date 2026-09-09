//! Native notifications: the persisted enabled toggle (`settings` submodule) and
//! the commands the web layer invokes to read it, set it, and fire a native
//! notification mirroring an in-app one.

mod settings;

use tauri::{AppHandle, Runtime};
use tauri_plugin_notification::NotificationExt;

pub use self::settings::{enabled, set_enabled};

/// Whether native notifications are enabled (the device-scoped preference behind
/// the tray toggle and the Desktop notification channel).
#[tauri::command]
pub fn notifications_enabled<R: Runtime>(app: AppHandle<R>) -> bool {
    settings::enabled(&app)
}

/// Set the notifications preference. Persists it and keeps the tray menu item in
/// sync (via `tray`), so the settings toggle and the tray toggle agree.
#[tauri::command]
pub fn set_notifications_enabled<R: Runtime>(app: AppHandle<R>, enabled: bool) {
    crate::tray::set_notifications_enabled(&app, enabled);
}

/// Fire a native notification, mirroring an in-app one. A no-op when
/// notifications are disabled, or when the main window is focused (the user is
/// already looking at the in-app notification) — so the web layer can always
/// call it.
#[tauri::command]
pub fn notify<R: Runtime>(app: AppHandle<R>, title: String, body: String) {
    if !settings::enabled(&app) || crate::tray::main_window_focused(&app) {
        return;
    }
    let _ = app.notification().builder().title(title).body(body).show();
}
