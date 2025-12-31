import { Client } from "@nvisy/sdk";

declare module "#app" {
	interface NuxtApp {
		$nvisyClient: ComputedRef<Client | null>;
	}
}

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const { authToken } = useAuth();

	// Track client instance outside Vue reactivity to avoid proxy issues with private class fields
	let client: Client | null = null;
	let lastToken: string | null = null;

	const nvisyClient = computed(() => {
		const token = authToken.value?.apiToken ?? null;

		if (token !== lastToken) {
			lastToken = token;
			client = token
				? new Client({
						apiToken: token,
						baseUrl: config.public.nvisyApiUrl as string,
					})
				: null;
		}

		return client;
	});

	return {
		provide: {
			nvisyClient,
		},
	};
});
