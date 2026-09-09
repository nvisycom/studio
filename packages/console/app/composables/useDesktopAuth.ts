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

/** Mark this a desktop build (token auth). Called once by the desktop shell. */
export function enableDesktopAuth() {
	desktopMode.value = true;
}

/** Inject (or clear) the desktop session token. Called by the desktop shell. */
export function setDesktopAuthToken(token: string | null) {
	desktopToken.value = token;
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
} {
	return {
		desktopToken: readonly(desktopToken),
		isDesktop: readonly(desktopMode),
	};
}
