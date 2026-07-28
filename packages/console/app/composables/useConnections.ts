import { useQuery, useMutation } from "@pinia/colada";
import type { CreateConnection, UpdateConnection } from "@nvisy/sdk/datatypes";

/**
 * Composable for connection operations
 */
export function useConnections() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

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
		onSuccess() {
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
