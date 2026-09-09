//! System tray: the tray icon and its menu (`menu` submodule) and the commands
//! the web layer invokes to localize the menu labels and reflect the unread
//! badge count.

mod menu;

use tauri::{AppHandle, Runtime};

pub use self::menu::{
    MAIN_WINDOW, TrayLabels, create, main_window_focused, on_window_event,
    set_notifications_enabled, show_main_window,
};

/// Push localized tray-menu labels resolved from the web layer's i18n catalog.
/// Called once the frontend boots and again whenever the user switches language,
/// so the tray always speaks the app's chosen language.
#[tauri::command]
pub fn set_tray_labels<R: Runtime>(app: AppHandle<R>, labels: TrayLabels) {
    menu::apply_labels(&app, labels);
}

/// Reflect the account's unread-notification count on the tray (a badge next to
/// the menu-bar icon, plus a localized `tooltip` on hover). Pushed by the web
/// layer from the live notification stream.
#[tauri::command]
pub fn set_badge_count<R: Runtime>(app: AppHandle<R>, count: u32, tooltip: Option<String>) {
    menu::apply_badge(&app, count, tooltip);
}
