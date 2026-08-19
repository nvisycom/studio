mod commands;
mod settings;
mod spotlight;
mod tray;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        .plugin(global_shortcut_plugin())
        .invoke_handler(tauri::generate_handler![
            commands::set_tray_labels,
            commands::toggle_spotlight,
            commands::hide_spotlight,
            commands::open_main_window,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // The tray is the app's anchor: it summons the main window and holds
            // the spotlight launcher, the notifications toggle, and quit.
            tray::create(app.handle())?;

            // Tray-first: closing the main window hides it (keeps the app alive
            // in the tray) instead of destroying the last window.
            if let Some(window) = app.get_webview_window(tray::MAIN_WINDOW) {
                let handle = window.clone();
                window.on_window_event(move |event| tray::on_window_event(&handle, event));
            }

            // The launcher dismisses itself on blur (spotlight-style) and hides
            // rather than closes, so it can be re-summoned by the hotkey.
            if let Some(window) = app.get_webview_window(spotlight::SPOTLIGHT_WINDOW) {
                let handle = window.clone();
                window.on_window_event(move |event| spotlight::on_window_event(&handle, event));
            }

            // Register the global hotkey that toggles the launcher from anywhere.
            register_spotlight_shortcut(app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// The global-shortcut plugin, with a handler that toggles the launcher when the
/// spotlight hotkey fires. Firing on key-press only (not release) keeps a single
/// tap from toggling twice. The target shortcut is parsed once and compared by
/// value (`Shortcut: PartialEq`).
fn global_shortcut_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    use tauri_plugin_global_shortcut::{Shortcut, ShortcutState};

    let toggle: Option<Shortcut> = spotlight::TOGGLE_SHORTCUT.parse().ok();

    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state() == ShortcutState::Pressed && toggle.as_ref() == Some(shortcut) {
                spotlight::toggle(app);
            }
        })
        .build()
}

/// Bind the spotlight toggle shortcut once the plugin is initialized. A failure
/// here (e.g. the combo is already claimed by another app) is logged and
/// swallowed — the tray item still opens the launcher, so the app stays usable.
fn register_spotlight_shortcut<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    if let Err(error) = app.global_shortcut().register(spotlight::TOGGLE_SHORTCUT) {
        log::warn!("failed to register spotlight shortcut: {error}");
    }
}
