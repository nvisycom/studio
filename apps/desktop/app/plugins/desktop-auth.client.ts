import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/**
 * Bridge the desktop's bearer-token auth to the shared layer.
 *
 * The desktop can't use the web's cookie session (its API calls go through the
 * Rust HTTP client, whose cookie jar the webview can't read). Instead it signs
 * in through the system browser and the server redirects an API token back via
 * a `nvisy://auth/callback` deep link; the Rust shell captures it, stores it in
 * the OS keychain, and hands it to the frontend here. The SDK client then sends
 * it as `Authorization: Bearer`.
 *
 * `enforce: "pre"` so the token is injected before the SDK plugin builds its
 * client. Runs only inside Tauri; a plain browser skips it entirely.
 */
export default defineNuxtPlugin({
	name: "desktop-auth",
	enforce: "pre",
	async setup() {
		if (!isTauri()) return;

		// Choose the token auth path (not cookies) for this build.
		enableDesktopAuth();

		// Signing out clears the token from the keychain, not just the ref.
		onDesktopSignOut(() => {
			invoke("clear_auth_token").catch(() => {});
		});

		// Restore a stored session on launch.
		try {
			const token = await invoke<string | null>("auth_token");
			setDesktopAuthToken(token ?? null);
		} catch {
			setDesktopAuthToken(null);
		}

		// The Rust shell captured a token from the sign-in deep link.
		listen<string>("auth://token", (event) => {
			setDesktopAuthToken(event.payload);
			// Land the user in the app once signed in.
			navigateTo("/");
		});
	},
});
