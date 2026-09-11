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

		// A token that arrived via the deep-link listener always wins over the
		// launch restore: a cold launch from the sign-in link delivers a fresh
		// token AND kicks off the keychain restore, and Tauri doesn't guarantee the
		// `auth_token` read resolves before the `auth://token` event — so a late
		// restore could otherwise clobber the just-signed-in token. This latches
		// once the deep link has set a token; the restore callback then bails.
		let signedInViaDeepLink = false;

		// Register the deep-link token listener BEFORE restoring the stored session,
		// so a token emitted during startup (a cold launch from the sign-in link)
		// isn't missed in the gap between restore and registration. `listen` is
		// async — a registration failure is logged rather than left unhandled.
		try {
			await listen<string>("auth://token", (event) => {
				signedInViaDeepLink = true;
				setDesktopAuthToken(event.payload);
				// Land the user in the app once signed in.
				navigateTo("/");
			});
		} catch (error) {
			console.error("Failed to register the desktop auth listener", error);
		}

		// Restore a stored session on launch — deferred until AFTER the first paint.
		// Reading the token hits the OS keychain, which can raise a system password
		// prompt (e.g. an unsigned dev build the keychain doesn't recognize). That
		// prompt is a process-level modal that freezes the webview's first frame, so
		// firing it during plugin init (before mount) leaves a blank window behind
		// it. Waiting for `app:mounted` lets the launch splash paint first, so the
		// prompt appears over the splash, not a white screen. The read stays
		// non-awaited: `desktopToken` is reactive, so the SDK client rebuilds and the
		// auth guard re-runs once it lands (same path a deep-link token takes).
		// `enableDesktopAuth()` above set `restoringDesktopAuth`, which shows the
		// splash until the read settles (to a token or null).
		const restoreSession = () => {
			invoke<string | null>("auth_token")
				.then((token) => {
					// A deep-link sign-in that landed first wins — don't overwrite its
					// fresh token with the (possibly older) keychain read.
					if (signedInViaDeepLink) return;
					setDesktopAuthToken(token ?? null);
				})
				.catch(() => {
					if (signedInViaDeepLink) return;
					setDesktopAuthToken(null);
				});
		};

		const nuxtApp = useNuxtApp();
		nuxtApp.hook("app:mounted", () => {
			// Wait until the splash frame has actually been painted before firing the
			// (potentially blocking) keychain prompt — two rAFs to get past the frame
			// Vue schedules on mount, then a macrotask so WKWebView has flushed the
			// paint to screen. Otherwise the prompt's modal freezes the compositor
			// before the splash renders, leaving a blank window behind it.
			requestAnimationFrame(() =>
				requestAnimationFrame(() => setTimeout(restoreSession, 0)),
			);
		});
	},
});
