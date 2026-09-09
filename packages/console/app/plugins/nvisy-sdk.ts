import type { ShallowRef } from "vue";
import { type ClientConfig, Nvisy } from "@nvisy/sdk";

declare module "#app" {
	interface NuxtApp {
		$nvisyClient: ShallowRef<Nvisy | null>;
	}
}

// The readable CSRF cookie the SPA echoes back on state-changing requests (the
// double-submit check). The HttpOnly session cookie authenticates; this proves
// the request came from our own page.
const CSRF_COOKIE_NAME = "nvisy.csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function csrfToken(): string | null {
	if (!import.meta.client) return null;
	const match = document.cookie
		.split("; ")
		.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
	return match
		? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1))
		: null;
}

/**
 * Wrap a fetch so state-changing requests echo the CSRF token for the
 * double-submit check. The session cookie itself is sent by the SDK's own
 * `credentials: "include"` option; only the CSRF header is the app's job (the
 * SDK is transport-agnostic and doesn't know the cookie's name).
 *
 * openapi-fetch invokes this with a built `Request` as the first arg (not an
 * `init` object), so the method and headers are read from the `Request`, and a
 * new `Request` is derived to add the header. A plain `(url, init)` call (should
 * any caller use one) is handled too.
 */
function withCsrf(base: typeof globalThis.fetch): typeof globalThis.fetch {
	return (input, init) => {
		const isRequest = input instanceof Request;
		const method = (
			init?.method ?? (isRequest ? input.method : "GET")
		).toUpperCase();
		if (!UNSAFE_METHODS.has(method)) return base(input, init);

		const token = csrfToken();
		if (!token) return base(input, init);

		const headers = new Headers(
			init?.headers ?? (isRequest ? input.headers : undefined),
		);
		headers.set(CSRF_HEADER_NAME, token);
		// Re-issue the Request so the added header takes effect (a Request's
		// headers are otherwise fixed at construction).
		if (isRequest) return base(new Request(input, { headers }));
		return base(input, { ...init, headers });
	};
}

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const { isAuthenticated, clearAuth } = useAuth();
	// The base URL is user-overridable (desktop connects to a self-hosted
	// server); rebuild the client when it changes.
	const { baseUrl, override } = useApiBaseUrl();
	// A custom fetch (desktop injects Tauri's native fetch to bypass CORS); the
	// SDK falls back to the global fetch when this is undefined (web).
	const { apiFetch } = useApiFetch();
	// Desktop authenticates with a bearer token (external-browser sign-in) rather
	// than cookies; a desktop build sends `Authorization: Bearer` and skips the
	// cookie/CSRF machinery. `isDesktop` (not token presence) selects the transport
	// so a desktop build never sends cookies over the Tauri fetch, even mid-login.
	const { desktopToken, isDesktop } = useDesktopAuth();
	// Capture the router in plugin setup context; the response handler below
	// runs from a fetch callback where composables like useRoute aren't valid.
	const router = useRouter();

	// A sliding session can lapse (idle timeout, server-side revocation). A 401
	// (missing/invalid session) means it's gone: clear it and bounce to login so
	// a dead session never renders the app shell. NOT 403 — under cookie auth a
	// 403 is a permission denial or a CSRF-check failure, both of which leave the
	// session intact, so logging out on them would wrongly kick the user.
	function handleUnauthorized(status: number) {
		if (status !== 401) return;
		if (!isAuthenticated.value) return; // already signed out

		clearAuth();

		if (!router.currentRoute.value.path.startsWith("/auth/")) {
			router.push("/auth/login");
		}
	}

	// When a request fails at the transport level — the fetch rejects, so there's
	// no HTTP response — the configured server is unreachable (down, moved, asleep,
	// network gone). For a signed-in user on a self-hosted server that's a
	// session-breaking event that today surfaces as a raw "Failed to fetch" buried
	// in a component; route it to the full-screen, server-aware error page instead.
	// Kept deliberately narrow so it never hijacks a request the UI handles inline:
	// only when authenticated, only with a custom server set, only off the error/
	// auth screens, and only once (guarded) until navigation clears it.
	let unreachableShown = false;
	function handleUnreachable() {
		if (!isAuthenticated.value) return; // pre-login flows handle their own errors
		if (!override.value) return; // hosted default: not the self-hosted story
		const path = router.currentRoute.value.path;
		if (path.startsWith("/auth/")) return; // login shows its own connection copy
		if (unreachableShown) return;
		unreachableShown = true;
		showError(
			createError({
				statusCode: 0,
				statusMessage: "server-unreachable",
				fatal: true,
			}),
		);
	}
	// Reset the guard on navigation, so a later retry that succeeds and then fails
	// again can surface the screen once more.
	router.afterEach(() => {
		unreachableShown = false;
	});

	// The auth transport: a desktop build sends a bearer token over the plain
	// fetch; the web sends the session cookie (`credentials: "include"`) over a
	// fetch wrapped to echo the CSRF header. Keyed on `isDesktop`, never on token
	// presence, so a desktop build never falls back to the cookie path. Two modes,
	// never mixed.
	function authTransport(): Pick<
		ClientConfig,
		"apiToken" | "credentials" | "fetch"
	> {
		const fetch = apiFetch.value ?? globalThis.fetch;
		if (isDesktop.value) {
			return { apiToken: desktopToken.value ?? "", fetch };
		}
		return { credentials: "include", fetch: withCsrf(fetch) };
	}

	function makeClient(): Nvisy {
		const client = new Nvisy({
			...authTransport(),
			baseUrl: baseUrl.value,
			withLogging: config.public.nvisySdkLogging as boolean,
		});
		// Intercept auth failures (a response arrived) and transport failures (the
		// fetch rejected — no response) globally on every request.
		client.api.use({
			onResponse({ response }) {
				handleUnauthorized(response.status);
				return response;
			},
			onError({ error }) {
				// A cancelled request (navigation aborting an in-flight fetch, a stale
				// query being dropped) rejects with an AbortError — that's not the
				// server being unreachable, so don't surface the full-screen error.
				const aborted =
					error instanceof DOMException && error.name === "AbortError";
				if (!aborted) handleUnreachable();
				// Don't swallow it — callers still see the original error and their
				// own reactive handling continues.
				return error as Error;
			},
		});
		return client;
	}

	// shallowRef (not computed): building a client is a side effect, and the SDK
	// holds private class fields that a deep reactive proxy would break.
	const nvisyClient: ShallowRef<Nvisy | null> = shallowRef(null);
	// Switching servers invalidates the whole session: it was minted by the old
	// server and every cached query holds the old server's data. Clear auth +
	// cache so the app returns to a clean login against the new server. Track the
	// previous value so a fetch-only change still just rebuilds the client.
	let prevBaseUrl = baseUrl.value;
	watch(
		// `desktopToken` is a source too: a token that changes value (not just
		// null↔set) must rebuild the client, which `isAuthenticated` alone misses.
		[isAuthenticated, baseUrl, apiFetch, desktopToken],
		([authed, currentBaseUrl]) => {
			if (currentBaseUrl !== prevBaseUrl) {
				prevBaseUrl = currentBaseUrl;
				if (isAuthenticated.value) {
					// clearAuth() flips isAuthenticated, which re-triggers this watcher
					// to rebuild the client as null (signed out).
					clearAuth();
					return;
				}
			}
			// The client exists whenever there's a session; requests carry the
			// cookie. Off-session (logged out) there's nothing to talk to.
			nvisyClient.value = authed ? makeClient() : null;
		},
		{ immediate: true },
	);

	return {
		provide: {
			nvisyClient,
		},
	};
});
