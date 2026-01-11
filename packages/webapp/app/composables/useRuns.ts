import { useQuery } from "@pinia/colada";
import type { IntegrationRun } from "@nvisy/sdk/datatypes";

// Mock data for development
const MOCK_RUNS: IntegrationRun[] = [
	{
		id: "run_01234567-89ab-cdef-0123-456789abcdef",
		workspaceId: "ws_mock-workspace-id",
		integrationId: "int_google-drive-001",
		accountId: null,
		runType: "manual",
		status: "running",
		metadata: {
			filesProcessed: 42,
			totalFiles: 100,
			currentFile: "quarterly-report.pdf",
		},
		startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
		completedAt: null,
	},
];

/**
 * Composable for integration run operations
 */
export function useRuns() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const runsQuery = useQuery({
		key: () => ["runs", currentWorkspaceId.value],
		query: async () => {
			// Return mock data for now
			return MOCK_RUNS;

			// TODO: Uncomment when backend is ready
			// const client = $nvisyClient.value;
			// const workspaceId = currentWorkspaceId.value;
			// if (!client || !workspaceId) throw new Error("Not authenticated");
			// const result = await client.runs.listRuns(workspaceId);
			// return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
	});

	async function getRun(runId: string): Promise<IntegrationRun> {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return await client.runs.getRun(runId);
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
