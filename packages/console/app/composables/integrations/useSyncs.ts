import type { SyncStatus } from "@nvisy/sdk/datatypes";

/**
 * Workspace-wide connection sync history, backed by
 * `syncs.listWorkspaceSyncs`. Supports server-side status filtering and cursor
 * pagination across every connection in the workspace.
 */
export function useSyncs(options?: { status?: Ref<SyncStatus | undefined> }) {
	const { requireContext, currentWorkspaceId } = useWorkspaceContext();
	const status = options?.status ?? ref<SyncStatus | undefined>(undefined);

	const syncsQuery = workspaceQuery(
		"syncs",
		({ client, workspaceId }) =>
			client.syncs.listWorkspaceSyncs(workspaceId, { status: status.value }),
		{
			key: () => ["syncs", currentWorkspaceId.value, status.value ?? "all"],
		},
	);

	const {
		items: syncs,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(syncsQuery.data, (after) => {
		const { client, workspaceId } = requireContext();
		return client.syncs.listWorkspaceSyncs(workspaceId, {
			status: status.value,
			after,
		});
	});

	const cancelSyncMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{ connectionId, syncId }: { connectionId: string; syncId: string },
		) => client.syncs.cancelSync(workspaceId, connectionId, syncId),
		{ invalidates: "syncs" },
	);

	return {
		syncs,
		isLoading: syncsQuery.isLoading,
		error: syncsQuery.error,
		refresh: syncsQuery.refresh,
		status,
		hasMore,
		loadMore,
		isLoadingMore,

		cancelSync: cancelSyncMutation.mutate,
		cancelSyncAsync: cancelSyncMutation.mutateAsync,
		isCancelling: cancelSyncMutation.isLoading,
	};
}
