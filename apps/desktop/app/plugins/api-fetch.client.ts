import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

/**
 * Route the SDK's API requests through Tauri's native HTTP.
 *
 * In the webview, the browser enforces CORS, and the API's origin allowlist
 * doesn't include the desktop origin — so a normal `fetch` to the API is
 * blocked. Tauri's `fetch` performs the request in the Rust process (no browser
 * origin, no CORS), which is what lets the desktop connect to any server the
 * user points at. The shared SDK layer reads this injected fetch via
 * `useApiFetch`; on the web (or a plain browser) it stays unset and the SDK uses
 * the global fetch.
 *
 * `enforce: "pre"` so this runs before the SDK plugin builds its client.
 */
// Detect the Tauri webview by its always-present internals object (set before
// any app JS runs), which is more reliable here than `isTauri()`'s global flag.
function inTauri(): boolean {
	return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export default defineNuxtPlugin({
	name: "api-fetch",
	enforce: "pre",
	setup() {
		if (inTauri()) setApiFetch(tauriFetch as typeof globalThis.fetch);
	},
});
