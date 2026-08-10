import type { PipelineRun } from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline run operations (workspace-scoped)
 */
export function useRuns() {
	const { requireContext } = useWorkspaceContext();

	const runsQuery = workspaceQuery(
		"runs",
		async ({ client, workspaceSlug }) => {
			const result = await client.runs.listRuns(workspaceSlug);
			return result.items;
		},
	);

	async function getRun(runId: string): Promise<PipelineRun> {
		const { client, workspaceSlug } = requireContext();
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
