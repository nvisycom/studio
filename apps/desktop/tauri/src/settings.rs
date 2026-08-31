//! Persisted desktop settings, backed by `tauri-plugin-store`.
//!
//! Holds the app-level (device-scoped) settings: the notifications toggle and
//! the watched-folder config. Values are written through immediately so they
//! survive a restart.

use serde::Serialize;
use serde_json::json;
use tauri::{AppHandle, Runtime};
use tauri_plugin_store::StoreExt;

/// The persisted watched-folder configuration: the folder to watch and the
/// workspace its files auto-upload to.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WatchConfig {
    pub folder: String,
    pub workspace_slug: String,
}

/// Store file name, created under the app's data directory.
const STORE_FILE: &str = "settings.json";
/// Key holding the notifications-enabled boolean.
const NOTIFICATIONS_KEY: &str = "notifications_enabled";
/// Notifications are on until the user turns them off.
const NOTIFICATIONS_DEFAULT: bool = true;
/// Key holding the watched-folder config (`{ folder, workspaceSlug }`) or absent.
const WATCH_KEY: &str = "watch_folder";

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

/// The watched-folder config, or `None` when no folder is watched (or the store
/// can't be read).
pub fn watch<R: Runtime>(app: &AppHandle<R>) -> Option<WatchConfig> {
    let store = app.store(STORE_FILE).ok()?;
    let value = store.get(WATCH_KEY)?;
    let folder = value.get("folder")?.as_str()?.to_owned();
    let workspace_slug = value.get("workspaceSlug")?.as_str()?.to_owned();
    Some(WatchConfig {
        folder,
        workspace_slug,
    })
}

/// Persist (or clear) the watched-folder config.
pub fn set_watch<R: Runtime>(app: &AppHandle<R>, config: Option<&WatchConfig>) {
    let Ok(store) = app.store(STORE_FILE) else {
        return;
    };
    match config {
        Some(c) => store.set(
            WATCH_KEY,
            json!({ "folder": c.folder, "workspaceSlug": c.workspace_slug }),
        ),
        None => {
            store.delete(WATCH_KEY);
        }
    }
}
