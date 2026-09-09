//! The spotlight launcher window.
//!
//! A small, borderless, always-on-top window — think Spotlight / Raycast — that
//! drops in from a global hotkey or the tray to let the user start something
//! (message the assistant, attach a file) without opening the full app. It is
//! declared hidden in `tauri.conf.json` and revealed on demand; like the main
//! window it is only ever hidden, never destroyed, so it can be re-summoned
//! instantly.
//!
//! It dismisses itself the moment it loses focus (again, like Spotlight), so the
//! launcher never lingers behind other windows.

use tauri::{AppHandle, Manager, Runtime, WindowEvent};

use crate::{auth, tray};

/// Label of the spotlight window (matches `tauri.conf.json`).
pub const SPOTLIGHT_WINDOW: &str = "spotlight";

/// The default global shortcut that toggles the launcher. Users can't rebind it
/// yet; kept here so the registration and the tray label stay in sync.
pub const TOGGLE_SHORTCUT: &str = "CmdOrCtrl+Shift+K";

/// Fraction of the screen height the launcher's top edge sits at — placing it in
/// the lower third (like a command bar rising from the bottom) rather than dead
/// center.
const VERTICAL_ANCHOR: f64 = 0.72;

/// Show, focus, and raise the launcher. Recreates nothing — the window is only
/// hidden, never destroyed, so it always exists to reveal. Positioned centered
/// horizontally and low on the current monitor before showing.
///
/// Signed out, the launcher is useless — everything it does needs auth — so we
/// summon the main window (which shows login) instead of a dead overlay.
pub fn show<R: Runtime>(app: &AppHandle<R>) {
    if !auth::is_authed(app) {
        tray::show_main_window(app);
        return;
    }
    if let Some(window) = app.get_webview_window(SPOTLIGHT_WINDOW) {
        position(&window);
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// Center the launcher horizontally and anchor it low on the monitor it's on.
/// Falls back to Tauri's centering if monitor/size info is unavailable.
fn position<R: Runtime>(window: &tauri::WebviewWindow<R>) {
    use tauri::{PhysicalPosition, Position};

    let placed = (|| {
        let monitor = window.current_monitor().ok().flatten()?;
        let screen = monitor.size();
        let win = window.outer_size().ok()?;
        let monitor_pos = monitor.position();

        // Center horizontally; anchor the top edge at VERTICAL_ANCHOR of the
        // screen height. Offset by the monitor's own origin so multi-monitor
        // setups place it on the active screen, not the primary.
        let x = monitor_pos.x + ((screen.width.saturating_sub(win.width)) / 2) as i32;
        let y = monitor_pos.y + (screen.height as f64 * VERTICAL_ANCHOR) as i32;
        window
            .set_position(Position::Physical(PhysicalPosition { x, y }))
            .ok()
    })();

    // No monitor info — fall back to centering so the window still appears.
    if placed.is_none() {
        let _ = window.center();
    }
}

/// Hide the launcher back out of sight.
pub fn hide<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(SPOTLIGHT_WINDOW) {
        let _ = window.hide();
    }
}

/// Toggle the launcher's visibility — the action bound to the global hotkey and
/// the tray item. Summons it when hidden, dismisses it when already up.
pub fn toggle<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(SPOTLIGHT_WINDOW) {
        if window.is_visible().unwrap_or(false) {
            hide(app);
        } else {
            show(app);
        }
    }
}

/// Dismiss the launcher when it loses focus, so it behaves like a spotlight
/// overlay rather than a lingering window. Wire this as the window's event
/// handler during setup.
pub fn on_window_event<R: Runtime>(window: &tauri::WebviewWindow<R>, event: &WindowEvent) {
    match event {
        // Focus lost — the user clicked away, so get out of the way.
        WindowEvent::Focused(false) => hide(window.app_handle()),
        // Closing (e.g. Esc-to-close from the frontend) hides rather than
        // destroys, mirroring the main window, so it can be summoned again.
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            let _ = window.hide();
        }
        _ => {}
    }
}
