import { useQuery } from "@pinia/colada";
import type { IntegrationRun } from "@nvisy/sdk";

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
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client || !workspaceId) throw new Error("Not authenticated");
      return await client.runs.list(workspaceId);
    },
    enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
  });

  async function getRun(runId: string): Promise<IntegrationRun> {
    const client = $nvisyClient.value;
    if (!client) throw new Error("Not authenticated");
    return await client.runs.get(runId);
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
