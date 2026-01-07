use tauri::{
    App, AppHandle, Manager, PhysicalPosition, WebviewWindow, Window, WindowEvent,
    menu::{Menu, MenuEvent, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get the main application window
fn get_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("main")
}

/// Show the window and bring it to focus
fn show_window(window: &WebviewWindow) {
    let _ = window.show();
    let _ = window.set_focus();
}

/// Hide the window to tray
fn hide_window(window: &WebviewWindow) {
    let _ = window.hide();
}

/// Position window below the tray icon, centered horizontally
fn position_window_at_tray(window: &WebviewWindow, tray_rect: &tauri::Rect) {
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
    let y = tray_y + tray_height + 8.0;

    let _ = window.set_position(PhysicalPosition::new(x as i32, y as i32));
}

/// Handle tray menu events
fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id.as_ref() {
        "quit" => {
            app.exit(0);
        }
        "show" => {
            if let Some(window) = get_main_window(app) {
                show_window(&window);
            }
        }
        _ => {}
    }
}

/// Handle tray icon click events
fn handle_tray_icon_event(tray: &TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        rect,
        ..
    } = event
    {
        let app = tray.app_handle();
        if let Some(window) = get_main_window(&app) {
            if window.is_visible().unwrap_or(false) {
                hide_window(&window);
            } else {
                position_window_at_tray(&window, &rect);
                show_window(&window);
            }
        }
    }
}

/// Handle window events
fn handle_window_event(window: &Window, event: &WindowEvent) {
    match event {
        WindowEvent::CloseRequested { api, .. } => {
            // Prevent the window from closing, hide it instead
            api.prevent_close();
            let _ = window.hide();
        }
        WindowEvent::Focused(false) => {
            // Hide window when it loses focus (clicking elsewhere)
            let _ = window.hide();
        }
        _ => {}
    }
}

/// Setup the system tray
fn setup_tray(app: &App) -> Result<TrayIcon, Box<dyn std::error::Error>> {
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;

    Ok(tray)
}

/// Setup the application (called once on startup)
fn setup_app(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    // Setup system tray
    let _tray = setup_tray(app)?;

    // Hide window initially - it will show when user clicks tray icon
    if let Some(window) = app.get_webview_window("main") {
        hide_window(&window);
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| setup_app(app))
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
