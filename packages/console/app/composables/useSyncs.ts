import type { ConnectionSync, SyncStatus } from "@nvisy/sdk/datatypes";

/**
 * Workspace-wide connection sync history, backed by
 * `syncs.listWorkspaceSyncs`. Supports server-side status filtering and cursor
 * pagination across every connection in the workspace.
 */
export function useSyncs(options?: { status?: Ref<SyncStatus | undefined> }) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const status = options?.status ?? ref<SyncStatus | undefined>(undefined);
	// Cursor of the last fetched page; drives "load more".
	const cursor = ref<string | undefined>(undefined);

	const syncsQuery = useQuery({
		key: () => ["syncs", currentWorkspaceSlug.value, status.value ?? "all"],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const result = await client.syncs.listWorkspaceSyncs(workspaceSlug, {
				status: status.value,
			});
			cursor.value = result.nextCursor;
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
	});

	// Accumulated pages beyond the first (the query holds page one).
	const extraPages = ref<ConnectionSync[]>([]);

	// Reset accumulated pages whenever the base query refetches (filter change).
	watch(syncsQuery.data, () => {
		extraPages.value = [];
	});

	const syncs = computed(() => [
		...(syncsQuery.data.value ?? []),
		...extraPages.value,
	]);
	const hasMore = computed(() => !!cursor.value);
	const isLoadingMore = ref(false);

	async function loadMore() {
		const client = $nvisyClient.value;
		const workspaceSlug = currentWorkspaceSlug.value;
		if (!client || !workspaceSlug || !cursor.value || isLoadingMore.value)
			return;
		isLoadingMore.value = true;
		try {
			const result = await client.syncs.listWorkspaceSyncs(workspaceSlug, {
				status: status.value,
				after: cursor.value,
			});
			extraPages.value = [...extraPages.value, ...result.items];
			cursor.value = result.nextCursor;
		} finally {
			isLoadingMore.value = false;
		}
	}

	const cancelSyncMutation = useMutation({
		mutation: async ({
			connectionId,
			syncId,
		}: {
			connectionId: string;
			syncId: string;
		}) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.syncs.cancelSync(workspaceSlug, connectionId, syncId);
		},
		onSuccess() {
			syncsQuery.refresh();
		},
	});

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
