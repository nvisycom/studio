import { NvisyGuest } from "@nvisy/sdk/guest";

/**
 * The pre-auth ("guest") SDK client, for calls made before a session exists —
 * login, signup, OIDC start, the server health probe, and the public auth
 * capabilities. It targets the effective base URL (respecting a self-hosted
 * override) and uses the injected fetch (desktop: Tauri's native fetch, to
 * bypass CORS), mirroring how the authenticated client is built.
 *
 * Rebuilt whenever the base URL or fetch changes so a server override takes
 * effect immediately.
 */
export function useGuestClient() {
	const { baseUrl } = useApiBaseUrl();
	const { apiFetch } = useApiFetch();

	const guest = computed(
		() => new NvisyGuest({ baseUrl: baseUrl.value, fetch: apiFetch.value }),
	);

	return { guest };
}
