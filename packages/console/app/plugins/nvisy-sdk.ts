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
	const { baseUrl } = useApiBaseUrl();
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

	function makeClient(token: string): Nvisy {
		const client = new Nvisy({
			apiToken: token,
			baseUrl: baseUrl.value,
			fetch: apiFetch.value,
			withLogging: config.public.nvisySdkLogging as boolean,
		});
		// Intercept auth failures globally on every request.
		client.api.use({
			onResponse({ response }) {
				handleUnauthorized(response.status);
				return response;
			},
		});
		return client;
	}

	// shallowRef (not computed): building a client is a side effect, and the SDK
	// holds private class fields that a deep reactive proxy would break.
	const nvisyClient: ShallowRef<Nvisy | null> = shallowRef(null);
	watch(
		[() => authToken.value?.apiToken ?? null, baseUrl, apiFetch],
		([token]) => {
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
