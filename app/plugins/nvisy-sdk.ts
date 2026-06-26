import { Nvisy } from "@nvisy/sdk";

declare module "#app" {
	interface NuxtApp {
		$nvisyClient: ComputedRef<Nvisy | null>;
	}
}

export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const { authToken } = useAuth();

	// Track client instance outside Vue reactivity to avoid proxy issues with private class fields.
	let client: Nvisy | null = null;
	let lastToken: string | null = null;

	const nvisyClient = computed(() => {
		const token = authToken.value?.apiToken ?? null;

		if (token !== lastToken) {
			lastToken = token;
			client = token
				? new Nvisy({
						apiToken: token,
						baseUrl: config.public.nvisyApiUrl as string,
						withLogging: config.public.nvisySdkLogging as boolean,
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
