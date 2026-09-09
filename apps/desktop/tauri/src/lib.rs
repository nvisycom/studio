mod auth;
mod files;
mod notifications;
mod spotlight;
mod store;
mod tray;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    register_plugins(tauri::Builder::default())
        .manage(auth::AuthState::default())
        .manage(files::DropLimit::default())
        .manage(files::watch::WatchState::default())
        .invoke_handler(command_handler())
        .setup(setup)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// The commands the web layer invokes, grouped by domain (each lives in its
/// domain's `mod.rs`).
fn command_handler<R: tauri::Runtime>() -> impl Fn(tauri::ipc::Invoke<R>) -> bool {
    tauri::generate_handler![
        auth::auth_token,
        auth::clear_auth_token,
        auth::set_authed,
        files::open_files,
        files::save_file,
        files::set_drop_limit,
        files::set_watch_folder,
        files::scan_watch_folder,
        files::watch_folder,
        files::clear_watch_folder,
        notifications::notify,
        notifications::notifications_enabled,
        notifications::set_notifications_enabled,
        spotlight::toggle_spotlight,
        spotlight::hide_spotlight,
        spotlight::open_main_window,
        tray::set_tray_labels,
        tray::set_badge_count,
    ]
}

/// Register every Tauri plugin, in the required order.
fn register_plugins(builder: tauri::Builder<tauri::Wry>) -> tauri::Builder<tauri::Wry> {
    // Single-instance MUST be the first plugin (Windows/Linux). A `nvisy://` deep
    // link starts a second process there; this forwards its argv to the running
    // instance, whose handler pulls the callback URL out and completes sign-in —
    // otherwise the token would land in the throwaway process. macOS delivers the
    // URL in-process via `on_open_url`, so it needs neither this plugin nor argv.
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        let urls: Vec<url::Url> = argv
            .iter()
            .filter_map(|arg| url::Url::parse(arg).ok())
            .filter(|url| url.scheme() == auth::CALLBACK_SCHEME)
            .collect();
        if !urls.is_empty() {
            auth::handle_deep_links(app, &urls);
        }
    }));

    builder
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_http::init())
        // Drives the native Finder open/save panels; the file commands read and
        // write the chosen paths in Rust so the webview never needs fs scope.
        .plugin(tauri_plugin_dialog::init())
        // Native completion notifications for long detection jobs.
        .plugin(tauri_plugin_notification::init())
        // Auth: open the system browser for sign-in (opener) and receive the
        // token back via the `nvisy://auth/callback` deep link.
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(spotlight::shortcut_plugin())
}

/// One-time app setup once the builder has run: install logging (debug), create
/// the tray, wire window events, and arm the launcher shortcut / folder watcher /
/// auth deep link.
fn setup(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if cfg!(debug_assertions) {
        app.handle().plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )?;
    }

    // The tray is the app's anchor: it summons the main window and holds the
    // spotlight launcher, the notifications toggle, and quit.
    tray::create(app.handle())?;

    wire_window_events(app);

    // Arm the launcher (global hotkey), resume a previously configured watched
    // folder, and capture the auth callback deep link.
    spotlight::register_shortcut(app.handle());
    files::watch::restore(app.handle());
    auth::register_deep_link(app.handle());

    Ok(())
}

/// Wire per-window event handlers: the main window hides (tray-first) and reads
/// OS file drops; the spotlight launcher dismisses on blur. Both windows only
/// hide, never close, so they can be re-summoned.
fn wire_window_events<R: tauri::Runtime>(app: &tauri::App<R>) {
    if let Some(window) = app.get_webview_window(tray::MAIN_WINDOW) {
        let handle = window.clone();
        window.on_window_event(move |event| {
            tray::on_window_event(&handle, event);
            files::on_window_event(&handle, event);
        });
    }

    if let Some(window) = app.get_webview_window(spotlight::SPOTLIGHT_WINDOW) {
        let handle = window.clone();
        window.on_window_event(move |event| spotlight::on_window_event(&handle, event));
    }
}
