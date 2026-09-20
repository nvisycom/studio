import type { IdentityProvider } from "@nvisy/sdk/datatypes";

/**
 * The server's advertised sign-in methods, from the pre-auth capabilities
 * endpoint (`getAuthCapabilities`). Drives the login/signup pages: which OIDC
 * providers to offer, in the order the server lists them.
 *
 * Runs before the app client exists, so it goes through the guest client.
 * Deployment-scoped and effectively static, so it's fetched once and not
 * refetched.
 */
export function useAuthCapabilities() {
	const { guest } = useGuestClient();
	const { baseUrl } = useApiBaseUrl();

	const capabilitiesQuery = useQuery({
		// Keyed on the effective base URL: a self-hosted override rebuilds the
		// guest client, and the key must change with it or a stale server's
		// capabilities (infinite staleTime) would stick.
		key: () => ["auth-capabilities", baseUrl.value],
		query: () => guest.value.capabilities.getAuthCapabilities(),
		staleTime: Number.POSITIVE_INFINITY,
	});

	// The sign-in methods the server advertises, in presentation order.
	const methods = computed<IdentityProvider[]>(
		() => capabilitiesQuery.data.value?.methods ?? [],
	);

	// The OIDC providers to offer (everything but password), preserving order.
	const oidcProviders = computed(() =>
		methods.value.filter((m) => m !== "password"),
	);

	return {
		methods,
		oidcProviders,
		isLoading: capabilitiesQuery.isLoading,
		error: capabilitiesQuery.error,
	};
}
