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

use tauri::{AppHandle, Manager, Runtime};

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
