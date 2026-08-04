import type {
	Connection,
	CreateConnection,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for connection operations
 */
export function useConnections() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	// Local state for optimistic updates (keyed by connection id).
	const optimisticUpdates = ref<
		Record<string, Partial<Connection> | UpdateConnection>
	>({});

	const connectionsQuery = useQuery({
		key: () => ["connections", currentWorkspaceSlug.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const result = await client.connections.listConnections(workspaceSlug);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
	});

	// Apply optimistic updates on top of the fetched list so toggles reflect
	// immediately (mirrors useWebhooks).
	const connections = computed<Connection[] | undefined>(() => {
		const data = connectionsQuery.data.value;
		if (!data) return data;
		return data.map((c) => ({
			...c,
			...optimisticUpdates.value[c.id],
		})) as Connection[];
	});

	const createConnectionMutation = useMutation({
		mutation: async (connection: CreateConnection) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.connections.createConnection(
				workspaceSlug,
				connection,
			);
		},
		onSuccess() {
			connectionsQuery.refresh();
		},
	});

	const updateConnectionMutation = useMutation({
		mutation: async ({
			connectionId,
			updates,
		}: {
			connectionId: string;
			updates: UpdateConnection;
		}) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.connections.updateConnection(
				workspaceSlug,
				connectionId,
				updates,
			);
		},
		onMutate({ connectionId, updates }) {
			optimisticUpdates.value = {
				...optimisticUpdates.value,
				[connectionId]: updates,
			};
		},
		onSettled(data, _error, variables) {
			// Use the server response as the source of truth once settled; on
			// error, drop the optimistic entry so the row reverts.
			if (data) {
				optimisticUpdates.value = {
					...optimisticUpdates.value,
					[variables.connectionId]: data,
				};
			} else {
				const { [variables.connectionId]: _, ...rest } =
					optimisticUpdates.value;
				optimisticUpdates.value = rest;
			}
			connectionsQuery.refresh();
		},
	});

	const deleteConnectionMutation = useMutation({
		mutation: async (connectionId: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			await client.connections.deleteConnection(workspaceSlug, connectionId);
		},
		onSuccess() {
			connectionsQuery.refresh();
		},
	});

	// Trigger a manual sync for a connection (syncs everything when no target).
	const startSyncMutation = useMutation({
		mutation: async (connectionId: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.syncs.startSync(workspaceSlug, connectionId, {});
		},
		onSuccess() {
			connectionsQuery.refresh();
		},
	});

	// Verify a connection is reachable with its stored credentials.
	const verifyConnectionMutation = useMutation({
		mutation: async (connectionId: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.connections.verifyConnection(
				workspaceSlug,
				connectionId,
			);
		},
	});

	return {
		// Query state
		connections,
		isLoading: connectionsQuery.isLoading,
		error: connectionsQuery.error,
		refresh: connectionsQuery.refresh,

		// Create
		createConnection: createConnectionMutation.mutate,
		createConnectionAsync: createConnectionMutation.mutateAsync,
		isCreating: createConnectionMutation.isLoading,
		createError: createConnectionMutation.error,

		// Update
		updateConnection: updateConnectionMutation.mutate,
		updateConnectionAsync: updateConnectionMutation.mutateAsync,
		isUpdating: updateConnectionMutation.isLoading,
		updateError: updateConnectionMutation.error,

		// Delete
		deleteConnection: deleteConnectionMutation.mutate,
		deleteConnectionAsync: deleteConnectionMutation.mutateAsync,
		isDeleting: deleteConnectionMutation.isLoading,
		deleteError: deleteConnectionMutation.error,

		// Manual sync
		startSync: startSyncMutation.mutate,
		startSyncAsync: startSyncMutation.mutateAsync,
		isSyncing: startSyncMutation.isLoading,
		syncError: startSyncMutation.error,

		// Verify (test) connection
		verifyConnection: verifyConnectionMutation.mutate,
		verifyConnectionAsync: verifyConnectionMutation.mutateAsync,
		isVerifying: verifyConnectionMutation.isLoading,
		verifyError: verifyConnectionMutation.error,
	};
}
