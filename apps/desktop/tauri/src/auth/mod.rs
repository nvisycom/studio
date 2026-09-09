//! Session auth: the shared signed-in state (`session` submodule) and the
//! commands the web layer invokes to read the stored token and report auth
//! changes.

mod session;

// Referenced only by the single-instance deep-link filter, which is compiled on
// Windows and Linux (macOS delivers the URL in-process instead).
use tauri::{AppHandle, Runtime};

#[cfg(any(target_os = "windows", target_os = "linux"))]
pub use self::session::{handle_deep_links, CALLBACK_SCHEME};
pub use self::session::{is_authed, register_deep_link, AuthState};

/// The stored session token, for the frontend to build its authed API client.
#[tauri::command]
pub fn auth_token() -> Option<String> {
    session::read_token()
}

/// Clear the session on sign-out: drop the stored token and the authed flag.
#[tauri::command]
pub fn clear_auth_token<R: Runtime>(app: AppHandle<R>) {
    session::delete_token();
    session::set_authed(&app, false);
}

/// Report whether the user is signed in, so the shell can make window decisions
/// (chiefly: don't summon the auth-only spotlight launcher when signed out).
/// Pushed by the web layer whenever auth state changes.
#[tauri::command]
pub fn set_authed<R: Runtime>(app: AppHandle<R>, authed: bool) {
    session::set_authed(&app, authed);
}
