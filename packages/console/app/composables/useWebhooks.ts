import type {
	Webhook,
	CreateWebhook,
	UpdateWebhook,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for webhook operations
 */
export function useWebhooks() {
	const webhooksQuery = workspaceQuery(
		"webhooks",
		async ({ client, workspaceSlug }) => {
			const result = await client.webhooks.listWebhooks(workspaceSlug);
			return result.items;
		},
	);

	// Reflect updates on a row immediately, reconciling once settled.
	const optimistic = useOptimisticList<Webhook, Partial<Webhook>>(
		webhooksQuery.data,
		(w) => w.id,
	);

	const createWebhookMutation = workspaceMutation(
		({ client, workspaceSlug }, webhook: CreateWebhook) =>
			client.webhooks.createWebhook(workspaceSlug, webhook),
		{ invalidates: webhooksQuery },
	);

	const updateWebhookMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ webhookId, updates }: { webhookId: string; updates: UpdateWebhook },
		) => client.webhooks.updateWebhook(workspaceSlug, webhookId, updates),
		{
			onMutate({ webhookId, updates }) {
				optimistic.apply(webhookId, updates);
			},
			onError(_error, { webhookId }) {
				optimistic.rollback(webhookId);
			},
			onSettled(data, _error, { webhookId }) {
				optimistic.settle(webhookId, data as Partial<Webhook> | undefined);
			},
		},
	);

	const deleteWebhookMutation = workspaceMutation(
		({ client, workspaceSlug }, webhookId: string) =>
			client.webhooks.deleteWebhook(workspaceSlug, webhookId),
		{
			invalidates: webhooksQuery,
			onMutate: (webhookId) => optimistic.remove(webhookId),
			onError: (_error, webhookId) => optimistic.restore(webhookId),
		},
	);

	const testWebhookMutation = workspaceMutation(
		({ client, workspaceSlug }, webhookId: string) =>
			client.webhooks.testWebhook(workspaceSlug, webhookId),
	);

	return {
		// Query state
		webhooks: optimistic.items,
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
