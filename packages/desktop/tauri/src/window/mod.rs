//! Window management utilities

mod events;

pub use events::handle_window_event;

use tauri::{
    AppHandle, Manager, PhysicalPosition, PhysicalSize, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
};

#[cfg(target_os = "macos")]
use tauri::TitleBarStyle;

/// Get the main application window
pub fn get_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("main")
}

/// Get the editor window
pub fn get_editor_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("editor")
}

/// Show the window and bring it to focus
pub fn show_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

/// Hide the window to tray
pub fn hide_window(window: &WebviewWindow) {
    let _ = window.hide();
}

/// Position window below the tray icon, centered horizontally
pub fn position_window_at_tray(window: &WebviewWindow, tray_rect: &tauri::Rect) {
    let window_size = window.outer_size().unwrap_or_default();

    // Get tray position and size
    let (tray_x, tray_y) = match tray_rect.position {
        tauri::Position::Physical(pos) => (pos.x as f64, pos.y as f64),
        tauri::Position::Logical(pos) => (pos.x, pos.y),
    };
    let tray_height = match tray_rect.size {
        tauri::Size::Physical(size) => size.height as f64,
        tauri::Size::Logical(size) => size.height,
    };

    // Center window horizontally under tray icon
    let x = tray_x - (window_size.width as f64 / 2.0);
    // Position below the tray with some offset for better visibility
    let y = tray_y + tray_height + 12.0;

    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
}

/// Get cursor position using Core Graphics (macOS)
#[cfg(target_os = "macos")]
fn get_cursor_position() -> Option<(i32, i32)> {
    use std::process::Command;

    // Use AppleScript to get mouse location
    let output = Command::new("osascript")
        .args([
            "-e",
            "tell application \"System Events\" to get {x, y} of (get position of mouse cursor) as list",
        ])
        .output()
        .ok()?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let coords: Vec<&str> = stdout.trim().split(", ").collect();
        if coords.len() == 2 {
            let x = coords[0].parse::<i32>().ok()?;
            let y = coords[1].parse::<i32>().ok()?;
            return Some((x, y));
        }
    }
    None
}

#[cfg(not(target_os = "macos"))]
fn get_cursor_position() -> Option<(i32, i32)> {
    // Fallback for other platforms - center of screen
    None
}

/// Position editor window near cursor, ensuring it stays within screen bounds
fn position_editor_window_near_cursor(window: &WebviewWindow) {
    let window_size = window.outer_size().unwrap_or(PhysicalSize::new(400, 200));

    // Try to get cursor position
    let (cursor_x, cursor_y) = get_cursor_position().unwrap_or((500, 300));

    // Get the monitor where the cursor is
    if let Some(monitor) = window.current_monitor().ok().flatten() {
        let monitor_pos = monitor.position();
        let monitor_size = monitor.size();

        // Calculate position - center horizontally on cursor, slightly above
        let mut x = cursor_x - (window_size.width as i32 / 2);
        let mut y = cursor_y - window_size.height as i32 - 20; // 20px above cursor

        // Ensure window stays within screen bounds
        let min_x = monitor_pos.x;
        let max_x = monitor_pos.x + monitor_size.width as i32 - window_size.width as i32;
        let min_y = monitor_pos.y;
        let max_y = monitor_pos.y + monitor_size.height as i32 - window_size.height as i32;

        x = x.clamp(min_x + 10, max_x - 10);
        y = y.clamp(min_y + 10, max_y - 10);

        // If window would be above screen (cursor near top), put it below cursor
        if y < min_y + 50 {
            y = cursor_y + 20;
            y = y.clamp(min_y + 10, max_y - 10);
        }

        let _ = window.set_position(PhysicalPosition::new(x, y));
    } else {
        // Fallback: just position at cursor
        let _ = window.set_position(PhysicalPosition::new(
            cursor_x - window_size.width as i32 / 2,
            cursor_y - window_size.height as i32 - 20,
        ));
    }
}

/// Create the editor window builder with platform-specific options
fn create_editor_builder(app: &AppHandle) -> WebviewWindowBuilder<'_, tauri::Wry, AppHandle> {
    let builder = WebviewWindowBuilder::new(app, "editor", WebviewUrl::App("/".into()))
        .title("Nvisy Workspace")
        .inner_size(1200.0, 800.0)
        .min_inner_size(900.0, 600.0)
        .always_on_top(false)
        .visible(false)
        .resizable(true)
        .skip_taskbar(true)
        .focused(true);

    #[cfg(target_os = "macos")]
    let builder = builder
        .title_bar_style(TitleBarStyle::Overlay)
        .hidden_title(true);

    builder
}

/// Create or show the editor window
pub fn show_editor_window(app: &AppHandle) {
    if let Some(window) = get_editor_window(app) {
        // Window exists, just show and position it
        position_editor_window_near_cursor(&window);
        show_window(&window);
    } else {
        // Create new editor window (not pinned by default)
        let window = create_editor_builder(app).build();

        if let Ok(window) = window {
            position_editor_window_near_cursor(&window);
            show_window(&window);
        }
    }
}
