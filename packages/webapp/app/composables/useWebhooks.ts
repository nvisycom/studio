import { useQuery, useMutation } from "@pinia/colada";
import type {
  Webhook,
  CreateWebhook,
  UpdateWebhook,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for webhook operations
 */
export function useWebhooks() {
  const { $nvisyClient } = useNuxtApp();
  const { authToken } = useAuth();
  const { currentWorkspaceId } = useWorkspaces();

  // Local state for optimistic updates
  const optimisticUpdates = ref<
    Record<string, Partial<Webhook> | UpdateWebhook>
  >({});

  const webhooksQuery = useQuery({
    key: () => ["webhooks", currentWorkspaceId.value],
    query: async () => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client || !workspaceId) throw new Error("Not authenticated");
      return await client.webhooks.listWebhooks(workspaceId);
    },
    enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
  });

  // Computed that applies optimistic updates on top of query data
  const webhooks = computed(() => {
    const data = webhooksQuery.data.value;
    if (!data) return data;
    return data.map((w) => ({
      ...w,
      ...optimisticUpdates.value[w.webhookId],
    }));
  });

  const createWebhookMutation = useMutation({
    mutation: async (webhook: CreateWebhook) => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client || !workspaceId) throw new Error("Not authenticated");
      return await client.webhooks.createWebhook(workspaceId, webhook);
    },
    onSuccess() {
      webhooksQuery.refresh();
    },
  });

  const updateWebhookMutation = useMutation({
    mutation: async ({
      webhookId,
      updates,
    }: {
      webhookId: string;
      updates: UpdateWebhook;
    }) => {
      const client = $nvisyClient.value;
      if (!client) throw new Error("Not authenticated");
      return await client.webhooks.updateWebhook(webhookId, updates);
    },
    onMutate({ webhookId, updates }) {
      // Optimistic update
      optimisticUpdates.value = {
        ...optimisticUpdates.value,
        [webhookId]: updates,
      };
    },
    onError(_error, variables) {
      // Rollback on error
      const { [variables.webhookId]: _, ...rest } = optimisticUpdates.value;
      optimisticUpdates.value = rest;
    },
    onSettled(data, _error, variables) {
      // Use the mutation response as source of truth
      // This avoids race conditions with the list endpoint
      if (data) {
        optimisticUpdates.value = {
          ...optimisticUpdates.value,
          [variables.webhookId]: data,
        };
      } else {
        // On error, clear the optimistic update
        const { [variables.webhookId]: _, ...rest } = optimisticUpdates.value;
        optimisticUpdates.value = rest;
      }
    },
  });

  const deleteWebhookMutation = useMutation({
    mutation: async (webhookId: string) => {
      const client = $nvisyClient.value;
      if (!client) throw new Error("Not authenticated");
      await client.webhooks.deleteWebhook(webhookId);
    },
    onSuccess() {
      webhooksQuery.refresh();
    },
  });

  const testWebhookMutation = useMutation({
    mutation: async (webhookId: string) => {
      const client = $nvisyClient.value;
      if (!client) throw new Error("Not authenticated");
      return await client.webhooks.testWebhook(webhookId);
    },
  });

  return {
    // Query state
    webhooks,
    isLoading: webhooksQuery.isLoading,
    error: webhooksQuery.error,
    refresh: webhooksQuery.refresh,

    // Create
    createWebhook: createWebhookMutation.mutate,
    createWebhookAsync: createWebhookMutation.mutateAsync,
    isCreating: createWebhookMutation.isLoading,
    createError: createWebhookMutation.error,

    // Update
    updateWebhook: updateWebhookMutation.mutate,
    updateWebhookAsync: updateWebhookMutation.mutateAsync,
    isUpdating: updateWebhookMutation.isLoading,
    updateError: updateWebhookMutation.error,

    // Delete
    deleteWebhook: deleteWebhookMutation.mutate,
    deleteWebhookAsync: deleteWebhookMutation.mutateAsync,
    isDeleting: deleteWebhookMutation.isLoading,
    deleteError: deleteWebhookMutation.error,

    // Test
    testWebhook: testWebhookMutation.mutate,
    testWebhookAsync: testWebhookMutation.mutateAsync,
    isTesting: testWebhookMutation.isLoading,
    testError: testWebhookMutation.error,
  };
}
