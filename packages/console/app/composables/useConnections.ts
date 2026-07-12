import { useQuery, useMutation } from "@pinia/colada";
import type { CreateConnection, UpdateConnection } from "@nvisy/sdk/datatypes";

/**
 * Composable for connection operations
 */
export function useConnections() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const connectionsQuery = useQuery({
		key: () => ["connections", currentWorkspaceId.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client || !workspaceId) throw new Error("Not authenticated");
			const result = await client.connections.listConnections(workspaceId);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
	});

	const createConnectionMutation = useMutation({
		mutation: async (connection: CreateConnection) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client || !workspaceId) throw new Error("Not authenticated");
			return await client.connections.createConnection(workspaceId, connection);
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
			if (!client) throw new Error("Not authenticated");
			return await client.connections.updateConnection(connectionId, updates);
		},
		onSuccess() {
			connectionsQuery.refresh();
		},
	});

	const deleteConnectionMutation = useMutation({
		mutation: async (connectionId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.connections.deleteConnection(connectionId);
		},
		onSuccess() {
			connectionsQuery.refresh();
		},
	});

	return {
		// Query state
		connections: connectionsQuery.data,
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
	};
}
