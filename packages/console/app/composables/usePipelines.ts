import { useQuery, useMutation } from "@pinia/colada";
import type { CreatePipeline, UpdatePipeline } from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline operations
 */
export function usePipelines() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const pipelinesQuery = useQuery({
		key: () => ["pipelines", currentWorkspaceSlug.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const result = await client.pipelines.listPipelines(workspaceSlug);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
	});

	const createPipelineMutation = useMutation({
		mutation: async (pipeline: CreatePipeline) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.pipelines.createPipeline(workspaceSlug, pipeline);
		},
		onSuccess() {
			pipelinesQuery.refresh();
		},
	});

	const updatePipelineMutation = useMutation({
		mutation: async ({
			pipelineSlug,
			updates,
		}: {
			pipelineSlug: string;
			updates: UpdatePipeline;
		}) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.pipelines.updatePipeline(
				workspaceSlug,
				pipelineSlug,
				updates,
			);
		},
		onSuccess() {
			pipelinesQuery.refresh();
		},
	});

	const deletePipelineMutation = useMutation({
		mutation: async (pipelineSlug: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			await client.pipelines.deletePipeline(workspaceSlug, pipelineSlug);
		},
		onSuccess() {
			pipelinesQuery.refresh();
		},
	});

	return {
		// Query state
		pipelines: pipelinesQuery.data,
		isLoading: pipelinesQuery.isLoading,
		error: pipelinesQuery.error,
		refresh: pipelinesQuery.refresh,

		// Create
		createPipeline: createPipelineMutation.mutate,
		createPipelineAsync: createPipelineMutation.mutateAsync,
		isCreating: createPipelineMutation.isLoading,
		createError: createPipelineMutation.error,

		// Update
		updatePipeline: updatePipelineMutation.mutate,
		updatePipelineAsync: updatePipelineMutation.mutateAsync,
		isUpdating: updatePipelineMutation.isLoading,
		updateError: updatePipelineMutation.error,

		// Delete
		deletePipeline: deletePipelineMutation.mutate,
		deletePipelineAsync: deletePipelineMutation.mutateAsync,
		isDeleting: deletePipelineMutation.isLoading,
		deleteError: deletePipelineMutation.error,
	};
}
