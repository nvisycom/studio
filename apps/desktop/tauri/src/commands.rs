//! Commands the web layer invokes on the Rust shell.

use tauri::{AppHandle, Runtime};

use crate::tray::{self, TrayLabels};

/// Push localized tray-menu labels resolved from the web layer's i18n catalog.
/// Called once the frontend boots and again whenever the user switches language,
/// so the tray always speaks the app's chosen language.
#[tauri::command]
pub fn set_tray_labels<R: Runtime>(app: AppHandle<R>, labels: TrayLabels) {
    tray::apply_labels(&app, labels);
}
