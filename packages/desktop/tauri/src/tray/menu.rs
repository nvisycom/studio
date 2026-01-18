/// Menu item identifiers and handling
use std::str::FromStr;

use strum::{AsRefStr, EnumString};

/// Menu item identifiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, AsRefStr, EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum MenuId {
    Show,
    Editor,
    CheckUpdates,
    Website,
    Changelog,
    #[strum(serialize = "github")]
    GitHub,
    Quit,
}

// URLs for menu items
pub const WEBSITE_URL: &str = "https://nvisy.com";
pub const CHANGELOG_URL: &str = "https://nvisy.com/changelog";
pub const GITHUB_URL: &str = "https://github.com/nvisycom";

/// Open URL in default browser
pub fn open_url(url: &str) {
    let _ = open::that(url);
}

use tauri::{AppHandle, Emitter, menu::MenuEvent};

use crate::window::{get_main_window, show_editor_window, show_window};

/// Handle tray menu events
pub fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    let Ok(menu_id) = MenuId::from_str(event.id.as_ref()) else {
        return;
    };

    match menu_id {
        MenuId::Quit => {
            app.exit(0);
        }
        MenuId::Show => {
            if let Some(window) = get_main_window(app) {
                show_window(&window);
            }
        }
        MenuId::Editor => {
            show_editor_window(app);
        }
        MenuId::CheckUpdates => {
            // TODO: Implement update check
            // For now, just show the main window on the about tab
            if let Some(window) = get_main_window(app) {
                show_window(&window);
                let _ = window.emit("navigate-to-tab", "about");
            }
        }
        MenuId::Website => {
            open_url(WEBSITE_URL);
        }
        MenuId::Changelog => {
            open_url(CHANGELOG_URL);
        }
        MenuId::GitHub => {
            open_url(GITHUB_URL);
        }
    }
}
