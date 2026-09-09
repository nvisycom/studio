/**
 * Validate a desktop sign-in deep-link callback target.
 *
 * When the desktop app opens the web login in the system browser, it passes a
 * `redirect_uri` naming the custom-scheme deep link the token should be handed
 * back on (see `mintDesktopToken` and nvisycom/server#285). Only a custom-scheme
 * URL is accepted — never an `http(s)` origin, which would let a web page mint a
 * native-app token toward itself. Returns the validated URI, or `null` when the
 * target is missing or not a usable custom-scheme deep link.
 *
 * The server enforces the same rule (the target must be a registered desktop
 * scheme); this is the client-side guard so a bad or hostile `redirect_uri`
 * never reaches the mint call.
 */
export function desktopCallbackUri(target: unknown): string | null {
	if (typeof target !== "string" || !target) return null;
	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		return null;
	}
	// A custom scheme only (e.g. `nvisy:`). Reject http/https and anything the
	// browser would treat as a network origin.
	if (parsed.protocol === "http:" || parsed.protocol === "https:") return null;
	return target;
}
