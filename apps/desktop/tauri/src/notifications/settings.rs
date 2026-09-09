//! The persisted notifications-enabled toggle (device-scoped), backed by the
//! shared settings store.

use crate::store;

/// Key holding the notifications-enabled boolean.
const NOTIFICATIONS_KEY: &str = "notifications_enabled";
/// Notifications are on until the user turns them off.
const NOTIFICATIONS_DEFAULT: bool = true;

/// Whether desktop notifications are currently enabled (defaulting to on when
/// nothing is stored yet, or the store can't be opened).
pub fn enabled<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> bool {
    let Some(store) = store::open(app) else {
        return NOTIFICATIONS_DEFAULT;
    };
    store
        .get(NOTIFICATIONS_KEY)
        .and_then(|v| v.as_bool())
        .unwrap_or(NOTIFICATIONS_DEFAULT)
}

/// Persist the notifications-enabled flag.
pub fn set_enabled<R: tauri::Runtime>(app: &tauri::AppHandle<R>, enabled: bool) {
    let Some(store) = store::open(app) else {
        return;
    };
    store.set(NOTIFICATIONS_KEY, enabled);
}
