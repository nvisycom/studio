//! Shared access to the persisted settings store (`tauri-plugin-store`).
//!
//! One `settings.json` under the app's data directory backs every device-scoped
//! preference (the notifications toggle, the watched-folder config). Callers open
//! it through here so they share the same file and the same graceful fallback
//! when it can't be opened.

use std::sync::Arc;

use tauri::{AppHandle, Runtime};
use tauri_plugin_store::{Store, StoreExt};

/// Store file name, created under the app's data directory.
const STORE_FILE: &str = "settings.json";

/// Open the shared settings store, or `None` when it can't be opened (callers
/// fall back to defaults rather than failing).
pub fn open<R: Runtime>(app: &AppHandle<R>) -> Option<Arc<Store<R>>> {
    app.store(STORE_FILE).ok()
}
