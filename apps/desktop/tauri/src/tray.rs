//! System-tray icon: the app's always-present anchor.
//!
//! Left-clicking the tray shows and focuses the main window; right-clicking
//! opens a menu to show/hide the window, toggle notifications (persisted), or
//! quit. The app is tray-first — closing the main window only hides it (see
//! `lib.rs`), so the tray stays the way back in.
//!
//! Menu labels are localized by the web layer: it resolves the strings from the
//! shared i18n catalog and pushes them via the `set_tray_labels` command (see
//! `commands`). Until that first push (the brief moment before the webview
//! boots) the built-in English defaults show.

use std::sync::Mutex;

use serde::Deserialize;
use tauri::menu::{MenuBuilder, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime, WindowEvent};

use crate::settings;

/// Label of the main window (matches `tauri.conf.json`).
pub const MAIN_WINDOW: &str = "main";

/// Menu item ids.
const MENU_WINDOW: &str = "window";
const MENU_NOTIFICATIONS: &str = "notifications";
const MENU_QUIT: &str = "quit";

/// The full set of tray labels, in every state variant, as resolved by the web
/// layer's i18n. Held so a state change (window shown/hidden, notifications
/// toggled) can relabel from cache without a frontend round-trip.
#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrayLabels {
    pub open_studio: String,
    pub minimize_to_tray: String,
    pub enable_notifications: String,
    pub disable_notifications: String,
    pub quit: String,
}

impl Default for TrayLabels {
    /// English defaults, shown until the web layer pushes localized strings.
    fn default() -> Self {
        Self {
            open_studio: "Open studio".into(),
            minimize_to_tray: "Minimize to tray".into(),
            enable_notifications: "Enable notifications".into(),
            disable_notifications: "Disable notifications".into(),
            quit: "Quit".into(),
        }
    }
}

impl TrayLabels {
    /// The window item's label for the given visibility (the action a click
    /// performs).
    fn window(&self, visible: bool) -> &str {
        if visible {
            &self.minimize_to_tray
        } else {
            &self.open_studio
        }
    }

    /// The notifications item's label for the given state (the action a click
    /// performs).
    fn notifications(&self, enabled: bool) -> &str {
        if enabled {
            &self.disable_notifications
        } else {
            &self.enable_notifications
        }
    }
}

/// Tray menu items whose labels change with app state or locale, plus the last
/// pushed label set. Held in app state so any handler (menu click, tray click,
/// window close, the label-push command) can refresh them.
pub struct TrayMenu<R: Runtime> {
    window: MenuItem<R>,
    notifications: MenuItem<R>,
    quit: MenuItem<R>,
    labels: Mutex<TrayLabels>,
}

/// Build the tray icon and attach its menu + click handlers. Called once during
/// setup. The items and current labels are stored in app state so they can be
/// relabeled as the window shows/hides, notifications toggle, and the locale
/// changes.
pub fn create<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let labels = TrayLabels::default();
    let window = MenuItem::with_id(
        app,
        MENU_WINDOW,
        labels.window(window_visible(app)),
        true,
        None::<&str>,
    )?;
    let notifications = MenuItem::with_id(
        app,
        MENU_NOTIFICATIONS,
        labels.notifications(settings::notifications_enabled(app)),
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, MENU_QUIT, &labels.quit, true, None::<&str>)?;
    let menu = MenuBuilder::new(app)
        .item(&window)
        .item(&notifications)
        .separator()
        .item(&quit)
        .build()?;

    app.manage(TrayMenu {
        window,
        notifications,
        quit,
        labels: Mutex::new(labels),
    });

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
        .on_menu_event(|app, event| on_menu_event(app, event.id().as_ref()))
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

/// Apply a freshly pushed label set: cache it and relabel every item to the
/// current state. Invoked by the `set_tray_labels` command when the web layer
/// resolves the strings and whenever the user switches language.
pub fn apply_labels<R: Runtime>(app: &AppHandle<R>, labels: TrayLabels) {
    let Some(menu) = app.try_state::<TrayMenu<R>>() else {
        return;
    };
    let _ = menu.window.set_text(labels.window(window_visible(app)));
    let _ = menu
        .notifications
        .set_text(labels.notifications(settings::notifications_enabled(app)));
    let _ = menu.quit.set_text(&labels.quit);
    // Cache in a helper so the mutex guard's scope is the call — not this
    // function's tail, where its destructor would outlive the `menu` borrow.
    cache_labels(&menu.labels, labels);
}

/// Store the latest pushed label set.
fn cache_labels(slot: &Mutex<TrayLabels>, labels: TrayLabels) {
    if let Ok(mut cached) = slot.lock() {
        *cached = labels;
    }
}

/// Handle a tray-menu selection.
fn on_menu_event<R: Runtime>(app: &AppHandle<R>, id: &str) {
    match id {
        MENU_WINDOW => {
            if window_visible(app) {
                hide_main_window(app);
            } else {
                show_main_window(app);
            }
        }
        MENU_NOTIFICATIONS => {
            let enabled = !settings::notifications_enabled(app);
            settings::set_notifications_enabled(app, enabled);
            refresh_notifications_item(app, enabled);
        }
        MENU_QUIT => app.exit(0),
        _ => {}
    }
}

/// Whether the main window is currently visible.
fn window_visible<R: Runtime>(app: &AppHandle<R>) -> bool {
    app.get_webview_window(MAIN_WINDOW)
        .and_then(|w| w.is_visible().ok())
        .unwrap_or(false)
}

/// Relabel the window item to match the window's visibility, from the cached
/// label set. Called after the window shows/hides.
fn refresh_window_item<R: Runtime>(app: &AppHandle<R>) {
    if let Some(menu) = app.try_state::<TrayMenu<R>>() {
        if let Ok(labels) = menu.labels.lock() {
            let _ = menu.window.set_text(labels.window(window_visible(app)));
        }
    }
}

/// Relabel the notifications item to match the given state, from the cached
/// label set.
fn refresh_notifications_item<R: Runtime>(app: &AppHandle<R>, enabled: bool) {
    if let Some(menu) = app.try_state::<TrayMenu<R>>() {
        if let Ok(labels) = menu.labels.lock() {
            let _ = menu.notifications.set_text(labels.notifications(enabled));
        }
    }
}

/// Show, unminimize, and focus the main window, recreating nothing — the window
/// is only ever hidden (never destroyed), so it always exists to reveal.
pub fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    refresh_window_item(app);
}

/// Hide the main window to the tray.
fn hide_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(MAIN_WINDOW) {
        let _ = window.hide();
    }
    refresh_window_item(app);
}

/// Intercept the main window's close request and hide it instead of destroying
/// it, so the app keeps running in the tray. Wire this as the window's event
/// handler during setup.
pub fn on_window_event<R: Runtime>(window: &tauri::WebviewWindow<R>, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        let _ = window.hide();
        refresh_window_item(window.app_handle());
    }
}
