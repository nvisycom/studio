import type {
	Connection,
	CreateConnection,
	StartFileServiceOAuth,
	UpdateConnection,
} from "@nvisy/sdk/datatypes";
import type { FileProvider } from "#console/utils/connections";

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
				// Optimistically reflect only the fields that render on the row and
				// are read-shape compatible. `config`/`sync` use write-only input
				// types (e.g. SyncScheduleInput vs the read SyncSchedule), so they
				// can't merge into a `Connection`; settle()/refresh reconciles them.
				const patch: Partial<Connection> = {};
				if (updates.displayName !== undefined)
					patch.displayName = updates.displayName;
				if (updates.isActive !== undefined) patch.isActive = updates.isActive;
				optimistic.apply(connectionId, patch);
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

	// Trigger a manual sync for a connection: an object-store sync runs the
	// connection's configured direction.
	const startSyncMutation = workspaceMutation(
		({ client, workspaceSlug }, connectionId: string) =>
			client.syncs.startSync(workspaceSlug, connectionId),
		{ invalidates: "connections" },
	);

	// Verify a connection is reachable with its stored credentials.
	const verifyConnectionMutation = workspaceMutation(
		({ client, workspaceSlug }, connectionId: string) =>
			client.connections.verifyConnection(workspaceSlug, connectionId),
	);

	// Begin the OAuth flow for a cloud file-service provider (Drive, Dropbox,
	// OneDrive, Box). Returns the provider's `authorizeUrl`; the caller sends the
	// browser there, and the server-side callback creates the connection after
	// the user grants access. No `invalidates` - the new connection appears only
	// after the redirect round-trip, not when this resolves.
	const startFileServiceOAuthMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{
				provider,
				request,
			}: { provider: FileProvider; request: StartFileServiceOAuth },
		) =>
			client.connections.startFileServiceOAuth(
				workspaceSlug,
				provider,
				request,
			),
	);

	// Export workspace files to a file-service connection. Each file's redacted
	// output is written to the connection as a new provider file; the source is
	// never overwritten. Returns the created sync.
	const exportFilesMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ connectionId, fileIds }: { connectionId: string; fileIds: string[] },
		) =>
			client.connections.exportFiles(workspaceSlug, connectionId, { fileIds }),
	);

	// Mint a short-lived provider access token for a browser file picker (Google
	// Drive, OneDrive, Box - the pickers that take a server token; Dropbox's
	// Chooser uses a client-side app key instead and rejects this). An optional
	// `resource` scopes the token to what the picker asked for (OneDrive requests
	// a token per resource); the server uses its default when omitted.
	const getPickerTokenMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ connectionId, resource }: { connectionId: string; resource?: string },
		) =>
			client.connections.getPickerToken(
				workspaceSlug,
				connectionId,
				resource ? { resource } : {},
			),
	);

	// Import the files a user picked in a provider's picker (id + name each);
	// already-imported files are skipped. Returns the created sync.
	const importFilesMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{
				connectionId,
				files,
			}: { connectionId: string; files: { id: string; name: string }[] },
		) => client.connections.importFiles(workspaceSlug, connectionId, { files }),
		{ invalidates: "connections" },
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

		// File-service OAuth (Drive, Dropbox, OneDrive, Box)
		startFileServiceOAuth: startFileServiceOAuthMutation.mutate,
		startFileServiceOAuthAsync: startFileServiceOAuthMutation.mutateAsync,
		isStartingOAuth: startFileServiceOAuthMutation.isLoading,
		oauthError: startFileServiceOAuthMutation.error,

		// Export workspace files to a file-service connection
		exportFiles: exportFilesMutation.mutate,
		exportFilesAsync: exportFilesMutation.mutateAsync,
		isExporting: exportFilesMutation.isLoading,
		exportError: exportFilesMutation.error,

		// Import from a file-service connection (browser picker)
		getPickerTokenAsync: getPickerTokenMutation.mutateAsync,
		importFilesAsync: importFilesMutation.mutateAsync,
		isImporting: importFilesMutation.isLoading,
	};
}
