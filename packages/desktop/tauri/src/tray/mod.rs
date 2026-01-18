//! System tray setup and event handling

mod menu;

use tauri::{
    App,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
};

use crate::error::BoxResult;
use crate::window::{get_main_window, hide_window, position_window_at_tray, show_window};
use menu::{MenuId, handle_menu_event};

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

/// Setup the system tray
pub fn setup_tray(app: &App) -> BoxResult<TrayIcon> {
    // Menu items
    let show_item =
        MenuItem::with_id(app, MenuId::Show.as_ref(), "Show Nvisy", true, None::<&str>)?;
    let editor_item = MenuItem::with_id(
        app,
        MenuId::Editor.as_ref(),
        "Open Editor",
        true,
        None::<&str>,
    )?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let check_updates_item = MenuItem::with_id(
        app,
        MenuId::CheckUpdates.as_ref(),
        "Check for Updates...",
        true,
        None::<&str>,
    )?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let website_item = MenuItem::with_id(
        app,
        MenuId::Website.as_ref(),
        "Visit Website",
        true,
        None::<&str>,
    )?;
    let changelog_item = MenuItem::with_id(
        app,
        MenuId::Changelog.as_ref(),
        "View Changelog",
        true,
        None::<&str>,
    )?;
    let github_item = MenuItem::with_id(
        app,
        MenuId::GitHub.as_ref(),
        "GitHub Repository",
        true,
        None::<&str>,
    )?;
    let separator3 = PredefinedMenuItem::separator(app)?;
    let quit_item =
        MenuItem::with_id(app, MenuId::Quit.as_ref(), "Quit Nvisy", true, None::<&str>)?;

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
