/// Window event handling
use tauri::{Emitter, Window, WindowEvent};

/// Handle window events
pub fn handle_window_event(window: &Window, event: &WindowEvent) {
    let window_label = window.label();

    match event {
        WindowEvent::CloseRequested { api, .. } => {
            // Prevent the window from closing, hide it instead
            api.prevent_close();
            let _ = window.hide();
        }
        WindowEvent::Focused(false) => {
            // Only auto-hide the main window, not the editor window
            if window_label == "main" {
                let window_clone = window.clone();
                std::thread::spawn(move || {
                    // Longer delay to allow drag-drop events to register before hiding
                    std::thread::sleep(std::time::Duration::from_millis(300));
                    let _ = window_clone.emit("check-hide-window", ());
                });
            }
            // Editor window stays open until explicitly closed
        }
        _ => {}
    }
}
