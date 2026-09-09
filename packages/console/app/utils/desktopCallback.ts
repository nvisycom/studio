/** The exact desktop deep-link the token may be handed back on. */
const DESKTOP_CALLBACK = "nvisy://auth/callback";

/**
 * Validate a desktop sign-in deep-link callback target.
 *
 * When the desktop app opens the web login in the system browser, it passes a
 * `redirect_uri` naming the deep link the token should be handed back on (see
 * `mintDesktopToken` and nvisycom/server#285). Only the app's own
 * `nvisy://auth/callback` is accepted — nothing else.
 *
 * This is a hard allowlist, not a scheme filter, because the middleware lets an
 * already-authenticated user stay on `/auth/login` when this passes, and the page
 * then mints a native-app token toward the target with no user confirmation. A
 * permissive check (any non-http scheme) would let one crafted link mint a
 * long-lived bearer token toward an arbitrary custom-scheme handler. The server
 * enforces the same allowlist; this is the client-side guard.
 *
 * Returns the target when it's the exact callback, else `null`.
 */
export function desktopCallbackUri(target: unknown): string | null {
	return target === DESKTOP_CALLBACK ? DESKTOP_CALLBACK : null;
}
