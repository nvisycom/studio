mod commands;
mod settings;
mod tray;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![commands::set_tray_labels])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // The tray is the app's anchor: it summons the main window and holds
            // the notifications toggle / quit.
            tray::create(app.handle())?;

            // Tray-first: closing the main window hides it (keeps the app alive
            // in the tray) instead of destroying the last window.
            if let Some(window) = app.get_webview_window(tray::MAIN_WINDOW) {
                let handle = window.clone();
                window.on_window_event(move |event| tray::on_window_event(&handle, event));
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
