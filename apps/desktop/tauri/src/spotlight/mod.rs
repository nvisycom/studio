//! The spotlight launcher: its window (`window` submodule) and the commands the
//! web layer invokes to drive it.

mod window;

use tauri::{AppHandle, Runtime};

pub use self::window::{
    on_window_event, register_shortcut, shortcut_plugin, toggle, SPOTLIGHT_WINDOW,
};

/// Toggle the spotlight launcher. Exposed so the frontend can offer an in-app
/// affordance to open it, mirroring the tray item and the global hotkey.
#[tauri::command]
pub fn toggle_spotlight<R: Runtime>(app: AppHandle<R>) {
    window::toggle(&app);
}

/// Hide the spotlight launcher — the frontend calls this to dismiss itself (e.g.
/// on Esc, or after handing a request off to the main window).
#[tauri::command]
pub fn hide_spotlight<R: Runtime>(app: AppHandle<R>) {
    window::hide(&app);
}

/// Open the main window and dismiss the spotlight launcher — the "Open the app"
/// affordance. Reveals (and focuses) the main window first, then hides the
/// launcher so it doesn't linger in front of it.
#[tauri::command]
pub fn open_main_window<R: Runtime>(app: AppHandle<R>) {
    crate::tray::show_main_window(&app);
    window::hide(&app);
}
