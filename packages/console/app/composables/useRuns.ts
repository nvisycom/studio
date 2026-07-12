import { useQuery } from "@pinia/colada";
import type { PipelineRun } from "@nvisy/sdk/datatypes";

// Mock data for development (aligned to the pipeline-run shape).
const MOCK_RUNS: PipelineRun[] = [
	{
		id: "run_01234567-89ab-cdef-0123-456789abcdef",
		pipelineId: "pl_document-redaction-001",
		fileId: "file_quarterly-report-001",
		accountId: undefined,
		status: "running",
		triggerType: "manual",
		metadata: {
			filesProcessed: 42,
			totalFiles: 100,
			currentFile: "quarterly-report.pdf",
		},
		startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
		completedAt: undefined,
	},
];

/**
 * Composable for pipeline run operations
 */
export function useRuns(pipelineId?: MaybeRefOrGetter<string | undefined>) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const runsQuery = useQuery({
		key: () => ["runs", toValue(pipelineId) ?? "mock"],
		query: async () => {
			const client = $nvisyClient.value;
			const id = toValue(pipelineId);

			// No pipeline selected yet — fall back to mock data.
			if (!client || !id) return MOCK_RUNS;

			const result = await client.runs.listRuns(id);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	async function getRun(runId: string): Promise<PipelineRun> {
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
