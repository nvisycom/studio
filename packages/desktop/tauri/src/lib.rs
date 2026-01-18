mod commands;
mod error;
mod shortcuts;
mod tray;
mod window;

use tauri::Manager;

use crate::error::BoxResult;
use crate::shortcuts::setup_global_shortcuts;
use crate::tray::setup_tray;
use crate::window::{handle_window_event, hide_window};

/// Setup the application (called once on startup)
fn setup_app(app: &mut tauri::App) -> BoxResult<()> {
    // Setup system tray
    let _tray = setup_tray(app)?;

    // Setup global shortcuts
    setup_global_shortcuts(app)?;

    // Hide main window initially - it will show when user clicks tray icon
    if let Some(window) = app.get_webview_window("main") {
        hide_window(&window);
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![commands::greet])
        .setup(|app| setup_app(app))
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
