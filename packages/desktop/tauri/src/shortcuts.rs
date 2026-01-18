/// Global keyboard shortcuts
use tauri::App;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

use crate::error::BoxResult;
use crate::window::show_editor_window;

/// Setup global shortcuts
pub fn setup_global_shortcuts(app: &App) -> BoxResult<()> {
    // Command+Shift+O to open workspace window
    let shortcut = Shortcut::new(Some(Modifiers::SHIFT | Modifiers::META), Code::KeyO);

    let app_handle = app.handle().clone();
    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |_app, _shortcut, event| {
                if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    show_editor_window(&app_handle);
                }
            })
            .build(),
    )?;

    // Register the shortcut
    app.global_shortcut().register(shortcut)?;

    Ok(())
}
