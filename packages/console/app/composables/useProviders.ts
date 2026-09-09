import type {
	CreateProvider,
	Provider,
	UpdateProvider,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for inference-provider operations — the LLM / NER services the
 * platform calls. Providers are a separate resource from connections: they carry
 * only inference config (an API key + model), never sync or file transfer.
 */
export function useProviders() {
	const providersQuery = workspaceQuery(
		"providers",
		({ client, workspaceSlug }) =>
			fetchAllPages((after) =>
				client.providers.listProviders(workspaceSlug, { after }),
			),
	);

	// Reflect updates on a row immediately, reconciling once settled.
	const optimistic = useOptimisticList<Provider, Partial<Provider>>(
		providersQuery.data,
		(p) => p.id,
	);

	const createProviderMutation = workspaceMutation(
		({ client, workspaceSlug }, provider: CreateProvider) =>
			client.providers.createProvider(workspaceSlug, provider),
		{ invalidates: "providers" },
	);

	const updateProviderMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ providerId, updates }: { providerId: string; updates: UpdateProvider },
		) => client.providers.updateProvider(workspaceSlug, providerId, updates),
		{
			onMutate({ providerId, updates }) {
				// Optimistically reflect only the fields that render on the row and are
				// read-shape compatible. `config` uses a write-only input type, so it
				// can't merge into a `Provider`; settle()/refresh reconciles it.
				const patch: Partial<Provider> = {};
				if (updates.displayName !== undefined)
					patch.displayName = updates.displayName;
				if (updates.isActive !== undefined) patch.isActive = updates.isActive;
				optimistic.apply(providerId, patch);
			},
			onSettled(data, _error, { providerId }) {
				optimistic.settle(providerId, data as Partial<Provider> | undefined);
				providersQuery.refresh();
			},
		},
	);

	const deleteProviderMutation = workspaceMutation(
		({ client, workspaceSlug }, providerId: string) =>
			client.providers.deleteProvider(workspaceSlug, providerId),
		{
			invalidates: "providers",
			onMutate: (providerId) => optimistic.remove(providerId),
			onError: (_error, providerId) => optimistic.restore(providerId),
		},
	);

	// Verify a provider is reachable with its stored credentials.
	const verifyProviderMutation = workspaceMutation(
		({ client, workspaceSlug }, providerId: string) =>
			client.providers.verifyProvider(workspaceSlug, providerId),
	);

	return {
		// Query state
		providers: optimistic.items,
		isLoading: providersQuery.isLoading,
		error: providersQuery.error,
		refresh: providersQuery.refresh,

		// Create
		createProvider: createProviderMutation.mutate,
		createProviderAsync: createProviderMutation.mutateAsync,
		isCreating: createProviderMutation.isLoading,
		createError: createProviderMutation.error,

		// Update
		updateProvider: updateProviderMutation.mutate,
		updateProviderAsync: updateProviderMutation.mutateAsync,
		isUpdating: updateProviderMutation.isLoading,
		updateError: updateProviderMutation.error,

		// Delete
		deleteProvider: deleteProviderMutation.mutate,
		deleteProviderAsync: deleteProviderMutation.mutateAsync,
		isDeleting: deleteProviderMutation.isLoading,
		deleteError: deleteProviderMutation.error,

		// Verify (test) provider
		verifyProvider: verifyProviderMutation.mutate,
		verifyProviderAsync: verifyProviderMutation.mutateAsync,
		isVerifying: verifyProviderMutation.isLoading,
		verifyError: verifyProviderMutation.error,
	};
}
