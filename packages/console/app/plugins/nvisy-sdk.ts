import type { ShallowRef } from "vue";
import { Nvisy } from "@nvisy/sdk";

declare module "#app" {
	interface NuxtApp {
		$nvisyClient: ShallowRef<Nvisy | null>;
	}
}

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const { authToken, clearAuth } = useAuth();
	// The base URL is user-overridable (desktop connects to a self-hosted
	// server); rebuild the client when it changes, not just on token change.
	const { baseUrl, override } = useApiBaseUrl();
	// A custom fetch (desktop injects Tauri's native fetch to bypass CORS); the
	// SDK falls back to the global fetch when this is undefined (web).
	const { apiFetch } = useApiFetch();
	// Capture the router in plugin setup context; the response handler below
	// runs from a fetch callback where composables like useRoute aren't valid.
	const router = useRouter();

	// A rejected token (revoked, expired server-side, etc.) can slip past the
	// local expiry check. Any 401/403 means the session is no longer valid:
	// clear it and bounce to login so a stale token never renders the app shell.
	function handleUnauthorized(status: number) {
		if (status !== 401 && status !== 403) return;
		if (!authToken.value) return; // already signed out

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
		if (!authToken.value) return; // pre-login flows handle their own errors
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

	function makeClient(token: string): Nvisy {
		const client = new Nvisy({
			apiToken: token,
			baseUrl: baseUrl.value,
			fetch: apiFetch.value,
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
	// Switching servers invalidates the whole session: the token was minted by
	// the old server (and would leak to the new one) and every cached query holds
	// the old server's data. Clear auth + cache so the app returns to a clean
	// login against the new server. Track the previous value so a token- or
	// fetch-only change still just rebuilds the client.
	let prevBaseUrl = baseUrl.value;
	watch(
		[() => authToken.value?.apiToken ?? null, baseUrl, apiFetch],
		([token, currentBaseUrl]) => {
			if (currentBaseUrl !== prevBaseUrl) {
				prevBaseUrl = currentBaseUrl;
				if (authToken.value) {
					// clearAuth() nulls the token, which re-triggers this watcher to
					// rebuild the client as null (signed out).
					clearAuth();
					return;
				}
			}
			nvisyClient.value = token ? makeClient(token) : null;
		},
		{ immediate: true },
	);

	return {
		provide: {
			nvisyClient,
		},
	};
});
