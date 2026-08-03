import type { PipelineRun } from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline run operations (workspace-scoped)
 */
export function useRuns() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const runsQuery = useQuery({
		key: () => ["runs", currentWorkspaceSlug.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const result = await client.runs.listRuns(workspaceSlug);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
	});

	async function getRun(runId: string): Promise<PipelineRun> {
		const client = $nvisyClient.value;
		const workspaceSlug = currentWorkspaceSlug.value;
		if (!client || !workspaceSlug) throw new Error("Not authenticated");
		return await client.runs.getRun(workspaceSlug, runId);
	}

	return {
		// Query state
		runs: runsQuery.data,
		isLoading: runsQuery.isLoading,
		error: runsQuery.error,
		refresh: runsQuery.refresh,

		// Get single run
		getRun,
	};
}
