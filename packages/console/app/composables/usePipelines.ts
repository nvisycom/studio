import type { CreatePipeline, UpdatePipeline } from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline operations
 */
export function usePipelines() {
	const pipelinesQuery = workspaceQuery(
		"pipelines",
		async ({ client, workspaceSlug }) => {
			const result = await client.pipelines.listPipelines(workspaceSlug);
			return result.items;
		},
	);

	const createPipelineMutation = workspaceMutation(
		({ client, workspaceSlug }, pipeline: CreatePipeline) =>
			client.pipelines.createPipeline(workspaceSlug, pipeline),
		{ invalidates: pipelinesQuery },
	);

	const updatePipelineMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{
				pipelineSlug,
				updates,
			}: { pipelineSlug: string; updates: UpdatePipeline },
		) => client.pipelines.updatePipeline(workspaceSlug, pipelineSlug, updates),
		{ invalidates: pipelinesQuery },
	);

	const deletePipelineMutation = workspaceMutation(
		({ client, workspaceSlug }, pipelineSlug: string) =>
			client.pipelines.deletePipeline(workspaceSlug, pipelineSlug),
		{ invalidates: pipelinesQuery },
	);

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
