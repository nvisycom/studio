//! Persisted desktop settings, backed by `tauri-plugin-store`.
//!
//! Only the notifications toggle lives here for now; the store file is the home
//! for future app-level settings (local folders, daemon options, …). Values are
//! written through immediately so they survive a restart.

use tauri::{AppHandle, Runtime};
use tauri_plugin_store::StoreExt;

/// Store file name, created under the app's data directory.
const STORE_FILE: &str = "settings.json";
/// Key holding the notifications-enabled boolean.
const NOTIFICATIONS_KEY: &str = "notifications_enabled";
/// Notifications are on until the user turns them off.
const NOTIFICATIONS_DEFAULT: bool = true;

/// Whether desktop notifications are currently enabled (defaulting to on when
/// nothing is stored yet, or the store can't be opened).
pub fn notifications_enabled<R: Runtime>(app: &AppHandle<R>) -> bool {
    let Ok(store) = app.store(STORE_FILE) else {
        return NOTIFICATIONS_DEFAULT;
    };
    store
        .get(NOTIFICATIONS_KEY)
        .and_then(|v| v.as_bool())
        .unwrap_or(NOTIFICATIONS_DEFAULT)
}

/// Persist the notifications-enabled flag.
pub fn set_notifications_enabled<R: Runtime>(app: &AppHandle<R>, enabled: bool) {
    let Ok(store) = app.store(STORE_FILE) else {
        return;
    };
    store.set(NOTIFICATIONS_KEY, enabled);
}
