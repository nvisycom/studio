mod auth;
mod commands;
mod files;
mod settings;
mod spotlight;
mod tray;
mod watch;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // `mut` is used only on Windows/Linux (the single-instance block below); on
    // macOS that block is cfg'd out, leaving the binding unmutated.
    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();

    // Single-instance MUST be the first plugin (Windows/Linux). A `nvisy://` deep
    // link starts a second process there; this forwards its argv to the running
    // instance, whose handler pulls the callback URL out and completes sign-in —
    // otherwise the token would land in the throwaway process. macOS delivers the
    // URL in-process via `on_open_url`, so it needs neither this plugin nor argv.
    #[cfg(any(target_os = "windows", target_os = "linux"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            let urls: Vec<url::Url> = argv
                .iter()
                .filter_map(|arg| url::Url::parse(arg).ok())
                .filter(|url| url.scheme() == auth::CALLBACK_SCHEME)
                .collect();
            if !urls.is_empty() {
                auth::handle_deep_links(app, &urls);
            }
        }));
    }

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
        .plugin(global_shortcut_plugin())
        .manage(auth::AuthState::default())
        .manage(files::DropLimit::default())
        .manage(watch::WatchState::default())
        .invoke_handler(tauri::generate_handler![
            commands::set_tray_labels,
            commands::set_authed,
            commands::toggle_spotlight,
            commands::hide_spotlight,
            commands::open_main_window,
            commands::open_files,
            commands::set_drop_limit,
            commands::save_file,
            commands::set_badge_count,
            commands::notify,
            commands::notifications_enabled,
            commands::set_notifications_enabled,
            commands::set_watch_folder,
            commands::watch_folder,
            commands::clear_watch_folder,
            commands::scan_watch_folder,
            auth::auth_token,
            auth::clear_auth_token,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // The tray is the app's anchor: it summons the main window and holds
            // the spotlight launcher, the notifications toggle, and quit.
            tray::create(app.handle())?;

            // Tray-first: closing the main window hides it (keeps the app alive
            // in the tray) instead of destroying the last window. The same
            // handler reads OS file drops on the window (in Rust) and emits them
            // to the frontend.
            if let Some(window) = app.get_webview_window(tray::MAIN_WINDOW) {
                let handle = window.clone();
                window.on_window_event(move |event| {
                    tray::on_window_event(&handle, event);
                    files::on_window_event(&handle, event);
                });
            }

            // The launcher dismisses itself on blur (spotlight-style) and hides
            // rather than closes, so it can be re-summoned by the hotkey.
            if let Some(window) = app.get_webview_window(spotlight::SPOTLIGHT_WINDOW) {
                let handle = window.clone();
                window.on_window_event(move |event| spotlight::on_window_event(&handle, event));
            }

            // Register the global hotkey that toggles the launcher from anywhere.
            register_spotlight_shortcut(app.handle());

            // Resume watching a previously configured folder (auto-upload).
            watch::restore(app.handle());

            // Auth deep link: capture the token the browser sign-in redirects to
            // (`nvisy://auth/callback?token=…`), whether the app was already
            // running (on_open_url) or cold-started by the link (current URLs).
            register_auth_deep_link(app.handle());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// The global-shortcut plugin, with a handler that toggles the launcher when the
/// spotlight hotkey fires. Firing on key-press only (not release) keeps a single
/// tap from toggling twice. The target shortcut is parsed once and compared by
/// value (`Shortcut: PartialEq`).
fn global_shortcut_plugin<R: tauri::Runtime>() -> tauri::plugin::TauriPlugin<R> {
    use tauri_plugin_global_shortcut::{Shortcut, ShortcutState};

    let toggle: Option<Shortcut> = spotlight::TOGGLE_SHORTCUT.parse().ok();

    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state() == ShortcutState::Pressed && toggle.as_ref() == Some(shortcut) {
                spotlight::toggle(app);
            }
        })
        .build()
}

/// Bind the spotlight toggle shortcut once the plugin is initialized. A failure
/// here (e.g. the combo is already claimed by another app) is logged and
/// swallowed — the tray item still opens the launcher, so the app stays usable.
fn register_spotlight_shortcut<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    if let Err(error) = app.global_shortcut().register(spotlight::TOGGLE_SHORTCUT) {
        log::warn!("failed to register spotlight shortcut: {error}");
    }
}

/// Wire the auth callback deep link. `on_open_url` fires while the app is
/// running (macOS, and the single-instance-forwarded case); the initial
/// `get_current` handles a cold start launched by the link. On Linux/Windows in
/// development the scheme also needs a runtime registration (`register_all`),
/// which is a no-op / handled by the installer in a bundled build.
fn register_auth_deep_link<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri_plugin_deep_link::DeepLinkExt;

    let deep_link = app.deep_link();

    #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
    if let Err(error) = deep_link.register_all() {
        log::warn!("failed to register deep-link scheme: {error}");
    }

    // A link that cold-started the app.
    if let Ok(Some(urls)) = deep_link.get_current() {
        auth::handle_deep_links(app, &urls);
    }

    // Links delivered while the app is already running.
    let handle = app.clone();
    deep_link.on_open_url(move |event| {
        auth::handle_deep_links(&handle, event.urls().as_slice());
    });
}
