/**
 * The web side of desktop external-browser sign-in.
 *
 * The desktop app opens the web login in the system browser with a
 * `redirect_uri` deep link (see the desktop `login.vue` and nvisycom/server#285).
 * Once the browser login establishes a normal cookie session — by password or
 * OIDC — this exchanges that session for a long-lived native-app token
 * (`mintDesktopToken`) and hands it back to the app by navigating to the deep
 * link with the token in the query (`{redirectUri}?token=<jwt>`). The desktop
 * shell captures it there and stores it in the OS keychain.
 *
 * The handoff is routed through the `/auth/desktop` page, which fires the deep
 * link and shows a "return to the app" confirmation (the browser tab is left
 * behind once the app takes over). The token-bearing URL is kept in memory here,
 * not put in the browser URL, so it never lands in history.
 *
 * On the plain web (no `redirect_uri`) this does nothing; the caller falls back
 * to its usual post-login navigation.
 */

// The deep-link URL (with token) to hand off to the desktop app, set by
// `completeDesktopSignIn` and consumed by the `/auth/desktop` page. Module scope
// so it survives the in-app navigation without riding in the URL.
const pendingHandoff = ref<string | null>(null);

/** The pending desktop handoff URL, read (once) by the `/auth/desktop` page. */
export function takeDesktopHandoff(): string | null {
	const url = pendingHandoff.value;
	pendingHandoff.value = null;
	return url;
}

export function useDesktopSignInReturn() {
	const { $nvisyClient } = useNuxtApp();

	/** The desktop callback from the current route, or null on a web login. */
	function callbackFromRoute(): string | null {
		return desktopCallbackUri(useRoute().query.redirect_uri);
	}

	/**
	 * Mint a token for the just-established session and route to the `/auth/desktop`
	 * confirmation page, which fires the deep-link handoff to the app. Returns
	 * `true` once that navigation has been triggered (the caller should not
	 * navigate further); `false` when this isn't a desktop flow, so the caller
	 * does its normal navigation. Throws if the mint fails so the caller can
	 * surface the error.
	 */
	async function completeDesktopSignIn(redirectUri: string): Promise<boolean> {
		// The mint is an authenticated POST (needs the fresh session cookie + the
		// CSRF echo), so it runs on the app client. Login flips `isAuthenticated`,
		// which rebuilds the client reactively; wait a tick for that to settle.
		await nextTick();
		const client = $nvisyClient.value;
		if (!client) return false;

		const { apiToken } = await client.auth.mintDesktopToken({ redirectUri });

		// Build the deep link the app is captured on, stash it in memory (not the
		// URL), and hand off to the confirmation page.
		const handoff = new URL(redirectUri);
		handoff.searchParams.set("token", apiToken);
		pendingHandoff.value = handoff.toString();
		await navigateTo("/auth/desktop");
		return true;
	}

	return { callbackFromRoute, completeDesktopSignIn };
}
