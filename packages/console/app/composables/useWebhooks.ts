import type {
	WorkspaceWebhook,
	CreateWorkspaceWebhook,
	UpdateWorkspaceWebhook,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for webhook operations
 */
export function useWebhooks() {
	const webhooksQuery = workspaceQuery("webhooks", ({ client, workspaceId }) =>
		fetchAllPages((after) =>
			client.webhooks.listWebhooks(workspaceId, { after }),
		),
	);

	// Reflect updates on a row immediately, reconciling once settled.
	const optimistic = useOptimisticList<
		WorkspaceWebhook,
		Partial<WorkspaceWebhook>
	>(webhooksQuery.data, (w) => w.id);

	const createWebhookMutation = workspaceMutation(
		({ client, workspaceId }, webhook: CreateWorkspaceWebhook) =>
			client.webhooks.createWebhook(workspaceId, webhook),
		{ invalidates: "webhooks" },
	);

	const updateWebhookMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				webhookId,
				updates,
			}: { webhookId: string; updates: UpdateWorkspaceWebhook },
		) => client.webhooks.updateWebhook(workspaceId, webhookId, updates),
		{
			onMutate({ webhookId, updates }) {
				optimistic.apply(webhookId, updates);
			},
			onError(_error, { webhookId }) {
				optimistic.rollback(webhookId);
			},
			onSettled(data, _error, { webhookId }) {
				optimistic.settle(
					webhookId,
					data as Partial<WorkspaceWebhook> | undefined,
				);
			},
		},
	);

	const deleteWebhookMutation = workspaceMutation(
		({ client, workspaceId }, webhookId: string) =>
			client.webhooks.deleteWebhook(workspaceId, webhookId),
		{
			invalidates: "webhooks",
			onMutate: (webhookId) => optimistic.remove(webhookId),
			onError: (_error, webhookId) => optimistic.restore(webhookId),
		},
	);

	const testWebhookMutation = workspaceMutation(
		({ client, workspaceId }, webhookId: string) =>
			client.webhooks.testWebhook(workspaceId, webhookId),
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
