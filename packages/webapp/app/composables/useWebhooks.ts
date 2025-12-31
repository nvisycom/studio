import { useQuery, useMutation } from "@pinia/colada";
import type {
	Webhook,
	WebhookWithSecret,
	CreateWebhook,
	UpdateWebhook,
} from "@nvisy/sdk";

/**
 * Composable for webhook operations
 */
export function useWebhooks() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const webhooksQuery = useQuery({
		key: () => ["webhooks", currentWorkspaceId.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client || !workspaceId) throw new Error("Not authenticated");
			return await client.webhooks.list(workspaceId);
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
	});

	const createWebhookMutation = useMutation({
		mutation: async (webhook: CreateWebhook) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client || !workspaceId) throw new Error("Not authenticated");
			return await client.webhooks.create(workspaceId, webhook);
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
			return await client.webhooks.update(webhookId, updates);
		},
		onSuccess() {
			webhooksQuery.refresh();
		},
	});

	const deleteWebhookMutation = useMutation({
		mutation: async (webhookId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.webhooks.delete(webhookId);
		},
		onSuccess() {
			webhooksQuery.refresh();
		},
	});

	return {
		// Query state
		webhooks: webhooksQuery.data,
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
	};
}
