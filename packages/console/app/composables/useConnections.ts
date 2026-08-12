import type {
	Connection,
	CreateConnection,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for connection operations
 */
export function useConnections() {
	const connectionsQuery = workspaceQuery(
		"connections",
		async ({ client, workspaceSlug }) => {
			const result = await client.connections.listConnections(workspaceSlug);
			return result.items;
		},
	);

	// Reflect updates on a row immediately, reconciling once settled.
	const optimistic = useOptimisticList<Connection, Partial<Connection>>(
		connectionsQuery.data,
		(c) => c.id,
	);

	const createConnectionMutation = workspaceMutation(
		({ client, workspaceSlug }, connection: CreateConnection) =>
			client.connections.createConnection(workspaceSlug, connection),
		{ invalidates: "connections" },
	);

	const updateConnectionMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{
				connectionId,
				updates,
			}: { connectionId: string; updates: UpdateConnection },
		) =>
			client.connections.updateConnection(workspaceSlug, connectionId, updates),
		{
			onMutate({ connectionId, updates }) {
				optimistic.apply(connectionId, updates);
			},
			onSettled(data, _error, { connectionId }) {
				optimistic.settle(
					connectionId,
					data as Partial<Connection> | undefined,
				);
				connectionsQuery.refresh();
			},
		},
	);

	const deleteConnectionMutation = workspaceMutation(
		({ client, workspaceSlug }, connectionId: string) =>
			client.connections.deleteConnection(workspaceSlug, connectionId),
		{
			invalidates: "connections",
			onMutate: (connectionId) => optimistic.remove(connectionId),
			onError: (_error, connectionId) => optimistic.restore(connectionId),
		},
	);

	// Trigger a manual sync for a connection (syncs everything when no target).
	const startSyncMutation = workspaceMutation(
		({ client, workspaceSlug }, connectionId: string) =>
			client.syncs.startSync(workspaceSlug, connectionId, {}),
		{ invalidates: "connections" },
	);

	// Verify a connection is reachable with its stored credentials.
	const verifyConnectionMutation = workspaceMutation(
		({ client, workspaceSlug }, connectionId: string) =>
			client.connections.verifyConnection(workspaceSlug, connectionId),
	);

	return {
		// Query state
		connections: optimistic.items,
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
