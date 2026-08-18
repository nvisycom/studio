//! System-tray icon: the app's always-present anchor.
//!
//! Left-clicking the tray shows and focuses the main window; right-clicking
//! opens a menu to toggle notifications (persisted) or quit. The app is
//! tray-first — closing the main window only hides it (see `lib.rs`), so the
//! tray stays the way back in.

use tauri::{
    menu::{MenuBuilder, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime, WindowEvent,
};

use crate::settings;

/// Label of the main window (matches `tauri.conf.json`).
pub const MAIN_WINDOW: &str = "main";

/// Menu item ids.
const MENU_NOTIFICATIONS: &str = "notifications";
const MENU_QUIT: &str = "quit";

/// Build the tray icon and attach its menu + click handlers. Called once during
/// setup. The notifications menu item is kept so its label can be refreshed when
/// the flag flips.
pub fn create<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let notifications = MenuItem::with_id(
        app,
        MENU_NOTIFICATIONS,
        notifications_label(settings::notifications_enabled(app)),
        true,
        None::<&str>,
    )?;
    let menu = MenuBuilder::new(app)
        .item(&notifications)
        .separator()
        .text(MENU_QUIT, "Quit")
        .build()?;

    TrayIconBuilder::with_id("main")
        .icon(
            app.default_window_icon().cloned().ok_or_else(|| {
                tauri::Error::AssetNotFound("no default window icon for tray".into())
            })?,
        )
        // The menu is shown on right-click only, so left-click reaches our
        // handler below rather than opening the menu.
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| on_menu_event(app, event.id().as_ref(), &notifications))
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// Handle a tray-menu selection.
fn on_menu_event<R: Runtime>(app: &AppHandle<R>, id: &str, notifications: &MenuItem<R>) {
    match id {
        MENU_NOTIFICATIONS => {
            let enabled = !settings::notifications_enabled(app);
            settings::set_notifications_enabled(app, enabled);
            // Reflect the new state in the menu label immediately.
            let _ = notifications.set_text(notifications_label(enabled));
        }
        MENU_QUIT => app.exit(0),
        _ => {}
    }
}

/// The notifications menu-item label for the current state.
fn notifications_label(enabled: bool) -> String {
    let state = if enabled { "Enabled" } else { "Disabled" };
    format!("Notifications: {state}")
}

/// Show, unminimize, and focus the main window, recreating nothing — the window
/// is only ever hidden (never destroyed), so it always exists to reveal.
pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Intercept the main window's close request and hide it instead of destroying
/// it, so the app keeps running in the tray. Wire this as the window's event
/// handler during setup.
pub fn on_window_event<R: Runtime>(window: &tauri::WebviewWindow<R>, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
    }
}
