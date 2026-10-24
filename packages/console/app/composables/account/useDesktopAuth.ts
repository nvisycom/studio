import type { Ref } from "vue";

/**
 * The desktop session token seam.
 *
 * The web app authenticates with cookies, but the desktop (Tauri) can't: its
 * API calls go through the Rust HTTP client, whose cookie jar the webview can't
 * read. So desktop signs in through the system browser and receives an API
 * token via a `nvisy://auth/callback` deep link (see nvisycom/server#285); the
 * token is sent as `Authorization: Bearer` instead.
 *
 * The desktop shell fills this seam (a desktop-only plugin reads the token from
 * the OS keychain and injects it here); the shared layer stays free of any
 * Tauri dependency. On the web this is always null, so the SDK plugin and
 * `useAuth` keep their cookie behavior.
 */
const desktopToken = ref<string | null>(null);
// Set once by the desktop shell at startup, independent of sign-in state, so the
// token auth path is chosen even before login (token still null) and never on
// the web. Without this, "no token yet" on desktop would wrongly fall back to
// the cookie path.
const desktopMode = ref(false);
// True while the shell is still restoring the stored token from the OS keychain
// at launch. The read is async (and can block on a keychain prompt), so the app
// boots before it resolves; during that window "no token" doesn't yet mean
// "signed out". The auth guard waits on this instead of bouncing a returning,
// authenticated user to the login screen. Cleared as soon as the read settles
// (to a token or to null).
const restoringDesktopAuth = ref(false);

/** Mark this a desktop build (token auth). Called once by the desktop shell. */
export function enableDesktopAuth() {
	desktopMode.value = true;
	// The shell restores the stored token right after this; hold auth decisions
	// until it does (see `restoringDesktopAuth`).
	restoringDesktopAuth.value = true;
}

/**
 * Inject (or clear) the desktop session token. Called by the desktop shell.
 * Settling the token — even to null — ends the launch restore window.
 */
export function setDesktopAuthToken(token: string | null) {
	desktopToken.value = token;
	restoringDesktopAuth.value = false;
}

// Sign-out hook: the desktop shell registers a callback that clears the token
// from the OS keychain (a Tauri command the layer can't call directly). `logout`
// runs it, so signing out drops the persisted credential, not just the ref.
let signOutHook: (() => void) | null = null;

/** Register the keychain-clearing sign-out handler. Called by the desktop shell. */
export function onDesktopSignOut(handler: () => void) {
	signOutHook = handler;
}

/** Run the desktop sign-out (clear keychain + local token). No-op on the web. */
export function runDesktopSignOut() {
	desktopToken.value = null;
	signOutHook?.();
}

export function useDesktopAuth(): {
	/** The desktop bearer token, or null on the web / when signed out. */
	desktopToken: Readonly<Ref<string | null>>;
	/** Whether this build authenticates with a desktop token (vs. web cookies). */
	isDesktop: Readonly<Ref<boolean>>;
	/** True while the launch keychain read is still in flight (desktop only). */
	restoringDesktopAuth: Readonly<Ref<boolean>>;
} {
	return {
		desktopToken: readonly(desktopToken),
		isDesktop: readonly(desktopMode),
		restoringDesktopAuth: readonly(restoringDesktopAuth),
	};
}
