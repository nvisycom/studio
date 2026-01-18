use tauri::{
    App, AppHandle, Emitter, Manager, PhysicalPosition, PhysicalSize, TitleBarStyle, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder, Window, WindowEvent,
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

/// Type alias for boxed errors used in setup
type SetupResult<T> = Result<T, Box<dyn std::error::Error>>;

// URLs for menu items
const WEBSITE_URL: &str = "https://nvisy.com";
const CHANGELOG_URL: &str = "https://nvisy.com/changelog";
const GITHUB_URL: &str = "https://github.com/nvisycom";

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get the main application window
fn get_main_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("main")
}

/// Get the editor window
fn get_editor_window(app: &AppHandle) -> Option<WebviewWindow> {
    app.get_webview_window("editor")
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

/// Create or show the editor window
fn show_editor_window(app: &AppHandle) {
    if let Some(window) = get_editor_window(app) {
        // Window exists, just show and position it
        position_editor_window_near_cursor(&window);
        show_window(&window);
    } else {
        // Create new editor window (not pinned by default)
        let window = WebviewWindowBuilder::new(app, "editor", WebviewUrl::App("/".into()))
            .title("Nvisy Workspace")
            .inner_size(1200.0, 800.0)
            .min_inner_size(900.0, 600.0)
            .title_bar_style(TitleBarStyle::Overlay)
            .hidden_title(true)
            .always_on_top(false)
            .visible(false)
            .resizable(true)
            .skip_taskbar(true)
            .focused(true)
            .build();

        if let Ok(window) = window {
            position_editor_window_near_cursor(&window);
            show_window(&window);
        }
    }
}

/// Open URL in default browser
fn open_url(url: &str) {
    let _ = open::that(url);
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
        "editor" => {
            show_editor_window(app);
        }
        "check_updates" => {
            // TODO: Implement update check
            // For now, just show the main window on the about tab
            if let Some(window) = get_main_window(app) {
                show_window(&window);
                let _ = window.emit("navigate-to-tab", "about");
            }
        }
        "website" => {
            open_url(WEBSITE_URL);
        }
        "changelog" => {
            open_url(CHANGELOG_URL);
        }
        "github" => {
            open_url(GITHUB_URL);
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
        if let Some(window) = get_main_window(app) {
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

/// Setup the system tray
fn setup_tray(app: &App) -> SetupResult<TrayIcon> {
    // Menu items
    let show_item = MenuItem::with_id(app, "show", "Show Nvisy", true, None::<&str>)?;
    let editor_item = MenuItem::with_id(app, "editor", "Open Editor", true, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let check_updates_item = MenuItem::with_id(
        app,
        "check_updates",
        "Check for Updates...",
        true,
        None::<&str>,
    )?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let website_item = MenuItem::with_id(app, "website", "Visit Website", true, None::<&str>)?;
    let changelog_item = MenuItem::with_id(app, "changelog", "View Changelog", true, None::<&str>)?;
    let github_item = MenuItem::with_id(app, "github", "GitHub Repository", true, None::<&str>)?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Nvisy", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_item,
            &editor_item,
            &separator1,
            &check_updates_item,
            &separator2,
            &website_item,
            &changelog_item,
            &github_item,
            &separator3,
            &quit_item,
        ],
    )?;

    let tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(handle_menu_event)
        .on_tray_icon_event(handle_tray_icon_event)
        .build(app)?;

    Ok(tray)
}

/// Setup global shortcuts
fn setup_global_shortcuts(app: &App) -> SetupResult<()> {
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

/// Setup the application (called once on startup)
fn setup_app(app: &mut App) -> SetupResult<()> {
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
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| setup_app(app))
        .on_window_event(handle_window_event)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
