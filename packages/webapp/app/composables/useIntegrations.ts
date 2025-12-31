import { useQuery, useMutation } from "@pinia/colada";
import type {
  Integration,
  CreateIntegration,
  UpdateIntegration,
} from "@nvisy/sdk";

/**
 * Composable for integration operations
 */
export function useIntegrations() {
  const { $nvisyClient } = useNuxtApp();
  const { authToken } = useAuth();
  const { currentWorkspaceId } = useWorkspaces();

  const integrationsQuery = useQuery({
    key: () => ["integrations", currentWorkspaceId.value],
    query: async () => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client || !workspaceId) throw new Error("Not authenticated");
      return await client.integrations.list(workspaceId);
    },
    enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
  });

  const createIntegrationMutation = useMutation({
    mutation: async (integration: CreateIntegration) => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client || !workspaceId) throw new Error("Not authenticated");
      return await client.integrations.create(workspaceId, integration);
    },
    onSuccess() {
      integrationsQuery.refresh();
    },
  });

  const updateIntegrationMutation = useMutation({
    mutation: async ({
      integrationId,
      updates,
    }: {
      integrationId: string;
      updates: UpdateIntegration;
    }) => {
      const client = $nvisyClient.value;
      if (!client) throw new Error("Not authenticated");
      return await client.integrations.update(integrationId, updates);
    },
    onSuccess() {
      integrationsQuery.refresh();
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutation: async (integrationId: string) => {
      const client = $nvisyClient.value;
      if (!client) throw new Error("Not authenticated");
      await client.integrations.delete(integrationId);
    },
    onSuccess() {
      integrationsQuery.refresh();
    },
  });

  return {
    // Query state
    integrations: integrationsQuery.data,
    isLoading: integrationsQuery.isLoading,
    error: integrationsQuery.error,
    refresh: integrationsQuery.refresh,

    // Create
    createIntegration: createIntegrationMutation.mutate,
    createIntegrationAsync: createIntegrationMutation.mutateAsync,
    isCreating: createIntegrationMutation.isLoading,
    createError: createIntegrationMutation.error,

    // Update
    updateIntegration: updateIntegrationMutation.mutate,
    updateIntegrationAsync: updateIntegrationMutation.mutateAsync,
    isUpdating: updateIntegrationMutation.isLoading,
    updateError: updateIntegrationMutation.error,

    // Delete
    deleteIntegration: deleteIntegrationMutation.mutate,
    deleteIntegrationAsync: deleteIntegrationMutation.mutateAsync,
    isDeleting: deleteIntegrationMutation.isLoading,
    deleteError: deleteIntegrationMutation.error,
  };
}
