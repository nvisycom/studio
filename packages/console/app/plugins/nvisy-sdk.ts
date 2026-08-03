import { Nvisy } from "@nvisy/sdk";

declare module "#app" {
	interface NuxtApp {
		$nvisyClient: ComputedRef<Nvisy | null>;
	}
}

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const { authToken, clearAuth } = useAuth();
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

	// Track client instance outside Vue reactivity to avoid proxy issues with private class fields.
	let client: Nvisy | null = null;
	let lastToken: string | null = null;

	const nvisyClient = computed(() => {
		const token = authToken.value?.apiToken ?? null;

		if (token !== lastToken) {
			lastToken = token;
			if (token) {
				client = new Nvisy({
					apiToken: token,
					baseUrl: config.public.nvisyApiUrl as string,
					withLogging: config.public.nvisySdkLogging as boolean,
				});
				// Intercept auth failures globally on every request.
				client.api.use({
					onResponse({ response }) {
						handleUnauthorized(response.status);
						return response;
					},
				});
			} else {
				client = null;
			}
		}

		return client;
	});

	return {
		provide: {
			nvisyClient,
		},
	};
});
