import type { Nvisy } from "@nvisy/sdk";
import type { ShallowRef } from "vue";
import { toast } from "vue-sonner";

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
 * behind once the app takes over). The token-bearing URL is kept in per-request
 * state, not put in the browser URL, so it never lands in history.
 *
 * On the plain web (no `redirect_uri`) this is inert; the caller falls back to
 * its usual post-login navigation.
 */

/** How long to wait for the authed client to rebuild after login before failing. */
const CLIENT_WAIT_MS = 5000;

/** The pending desktop handoff URL, read (once) by the `/auth/desktop` page. */
export function takeDesktopHandoff(): string | null {
	// `useState` gives per-request isolation — a bearer token must never be shared
	// across requests the way a module-scoped ref would be on the server.
	const pending = useState<string | null>("desktop-handoff", () => null);
	const url = pending.value;
	pending.value = null;
	return url;
}

export function useDesktopSignInReturn() {
	const { $nvisyClient } = useNuxtApp();
	const { t } = useI18n();

	/** The desktop callback from the current route, or null on a web login. */
	function callbackFromRoute(): string | null {
		return desktopCallbackUri(useRoute().query.redirect_uri);
	}

	// The mint runs on the app client, which login rebuilds reactively; wait for it
	// to appear (a single tick isn't a guarantee the rebuild has settled) rather
	// than giving up and silently falling through to a web navigation.
	function awaitClient(): Promise<Nvisy> {
		const clientRef = $nvisyClient as ShallowRef<Nvisy | null>;
		if (clientRef.value) return Promise.resolve(clientRef.value);
		return new Promise((resolve, reject) => {
			const stop = watch(clientRef, (client) => {
				if (!client) return;
				stop();
				clearTimeout(timer);
				resolve(client);
			});
			const timer = setTimeout(() => {
				stop();
				reject(new Error("The account client was not ready in time"));
			}, CLIENT_WAIT_MS);
		});
	}

	/**
	 * Mint a token for the just-established session and route to the `/auth/desktop`
	 * confirmation page, which fires the deep-link handoff to the app. The caller
	 * must not navigate further after this resolves. Throws if the mint (or the
	 * client wait) fails, so the caller surfaces the error rather than stranding
	 * the desktop app.
	 */
	async function completeDesktopSignIn(redirectUri: string): Promise<void> {
		const client = await awaitClient();
		const { apiToken } = await client.auth.mintDesktopToken({ redirectUri });

		// Build the deep link the app is captured on, stash it in per-request state
		// (not the URL), and hand off to the confirmation page.
		const handoff = new URL(redirectUri);
		handoff.searchParams.set("token", apiToken);
		useState<string | null>("desktop-handoff", () => null).value =
			handoff.toString();
		await navigateTo("/auth/desktop");
	}

	/**
	 * If this is a desktop sign-in (a `redirect_uri` is present), mint the token,
	 * hand it off, and return `true` — the caller should stop, not navigate. On a
	 * plain web login there's no callback and it returns `false`. A mint failure is
	 * surfaced as a toast and also returns `true`, since the flow was a desktop one
	 * (the caller still shouldn't run its web navigation).
	 */
	async function tryDesktopHandoff(): Promise<boolean> {
		const callback = callbackFromRoute();
		if (!callback) return false;
		try {
			await completeDesktopSignIn(callback);
		} catch {
			toast.error(t("auth.shared.oidcFailed"));
		}
		return true;
	}

	return { callbackFromRoute, completeDesktopSignIn, tryDesktopHandoff };
}
