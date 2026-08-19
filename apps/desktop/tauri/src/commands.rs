//! Commands the web layer invokes on the Rust shell.

use tauri::{AppHandle, Runtime};

use crate::spotlight;
use crate::tray::{self, TrayLabels};

/// Push localized tray-menu labels resolved from the web layer's i18n catalog.
/// Called once the frontend boots and again whenever the user switches language,
/// so the tray always speaks the app's chosen language.
#[tauri::command]
pub fn set_tray_labels<R: Runtime>(app: AppHandle<R>, labels: TrayLabels) {
    tray::apply_labels(&app, labels);
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
