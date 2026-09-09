//! Session auth state, shared from the web layer to the Rust shell.
//!
//! Whether the user is signed in lives in the frontend (localStorage via
//! `useAuth`), but the shell needs it to make window decisions — chiefly, the
//! spotlight launcher is useless when signed out (everything it does needs auth),
//! so the shell should summon the main window (which shows login) instead of an
//! empty overlay. The web layer pushes the current state through the `set_authed`
//! command whenever it changes; the shell holds the latest value in managed
//! state and reads it on demand. Managed state (not the persisted store) fits:
//! this is ephemeral session state, re-pushed on every launch.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, Runtime};

/// The last auth state the web layer reported. Defaults to signed-out until the
/// frontend boots and pushes the real value, so a launcher summoned before that
/// errs toward the main window rather than a dead overlay.
#[derive(Default)]
pub struct AuthState {
    authed: Mutex<bool>,
}

impl AuthState {
    /// Record whether the user is signed in (called from the `set_authed` command).
    pub fn set(&self, authed: bool) {
        if let Ok(mut guard) = self.authed.lock() {
            *guard = authed;
        }
    }

    /// Whether the user is currently signed in.
    pub fn is_authed(&self) -> bool {
        self.authed.lock().map(|guard| *guard).unwrap_or(false)
    }
}

/// Read the shared auth state from the app handle. False until the frontend has
/// pushed a value (managed state is registered at setup with the default).
pub fn is_authed<R: Runtime>(app: &AppHandle<R>) -> bool {
    app.state::<AuthState>().is_authed()
}

// ── Session token (external-browser auth) ────────────────────────────────────
//
// The desktop can't use the web's cookie session: its API calls go through the
// Rust HTTP client, whose cookie jar the webview can't read, and remote cookies
// don't stick to the `tauri://` origin. So desktop authenticates by opening the
// system browser (where password + OIDC both work); the web page there mints a
// native-app token from the session and hands it back via
// `nvisy://auth/callback?token=<jwt>` (see nvisycom/server#285). The token is
// stashed in the OS keychain and sent as `Authorization: Bearer`.

/// The custom scheme + callback path the server redirects the token to.
pub const CALLBACK_SCHEME: &str = "nvisy";

/// Event emitted to the frontend when a token arrives from the deep-link
/// callback, so the app can build its authed client and route into the shell.
pub const TOKEN_EVENT: &str = "auth://token";

/// Keychain coordinates for the session token. The service is the app's bundle
/// id; the account names the single stored credential.
const KEYRING_SERVICE: &str = "com.nvisy.studio";
const KEYRING_ACCOUNT: &str = "session-token";

fn keyring_entry() -> keyring::Result<keyring::Entry> {
    keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
}

/// Read the stored session token, or `None` when unset (or the platform has no
/// usable keychain — a headless Linux box without a Secret Service provider;
/// that degrades to "signed out", never a crash).
pub fn read_token() -> Option<String> {
    match keyring_entry().and_then(|e| e.get_password()) {
        Ok(token) => Some(token),
        Err(keyring::Error::NoEntry) => None,
        Err(error) => {
            log::warn!("keychain read failed: {error}");
            None
        }
    }
}

/// Persist the session token to the keychain. A failure is logged, not fatal;
/// the app still works for the session (the token is held in memory by the
/// client), it just won't survive a restart.
fn write_token(token: &str) {
    if let Err(error) = keyring_entry().and_then(|e| e.set_password(token)) {
        log::warn!("keychain write failed: {error}");
    }
}

/// Remove the stored session token (sign-out).
fn delete_token() {
    match keyring_entry().and_then(|e| e.delete_credential()) {
        Ok(()) | Err(keyring::Error::NoEntry) => {}
        Err(error) => log::warn!("keychain delete failed: {error}"),
    }
}

/// Extract the `token` value from a `nvisy://auth/callback?token=…` (query) or
/// `#token=…` (fragment) deep-link URL. Returns `None` for any other URL or a
/// callback carrying `signin=error` / no token.
fn token_from_url(url: &str) -> Option<String> {
    let parsed = url::Url::parse(url).ok()?;
    if parsed.scheme() != CALLBACK_SCHEME {
        return None;
    }
    // The token rides in the query; also accept the fragment as a fallback.
    let source = parsed.query().or(parsed.fragment())?;
    form_urlencoded::parse(source.as_bytes())
        .find(|(k, _)| k == "token")
        .map(|(_, v)| v.into_owned())
        .filter(|t| !t.is_empty())
}

/// Handle one or more deep-link URLs the OS delivered (a cold-start launch may
/// carry several). On the first that carries a token: store it, mark authed,
/// bring the main window forward, and notify the frontend.
pub fn handle_deep_links<R: Runtime>(app: &AppHandle<R>, urls: &[url::Url]) {
    for url in urls {
        if let Some(token) = token_from_url(url.as_str()) {
            write_token(&token);
            app.state::<AuthState>().set(true);
            if let Some(window) = app.get_webview_window(crate::tray::MAIN_WINDOW) {
                let _ = window.show();
                let _ = window.set_focus();
            }
            let _ = app.emit(TOKEN_EVENT, &token);
            return;
        }
    }
}

/// The stored session token, for the frontend to build its authed API client.
#[tauri::command]
pub fn auth_token() -> Option<String> {
    read_token()
}

/// Clear the session on sign-out: drop the stored token and the authed flag.
#[tauri::command]
pub fn clear_auth_token<R: Runtime>(app: AppHandle<R>) {
    delete_token();
    app.state::<AuthState>().set(false);
}
