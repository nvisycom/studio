import type { CreatePipeline, UpdatePipeline } from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline operations
 */
export function usePipelines() {
	const { requireContext } = useWorkspaceContext();

	const pipelinesQuery = workspaceQuery(
		"pipelines",
		async ({ client, workspaceSlug }) => {
			const result = await client.pipelines.listPipelines(workspaceSlug);
			return result.items;
		},
	);

	// Pipelines are keyed by slug; a delete drops the row immediately.
	const optimistic = useOptimisticList(pipelinesQuery.data, (p) => p.slug);

	// Fetch a single pipeline with its full definition + retention (the list only
	// returns summaries).
	async function getPipeline(pipelineSlug: string) {
		const { client, workspaceSlug } = requireContext();
		return await client.pipelines.getPipeline(workspaceSlug, pipelineSlug);
	}

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
		{
			invalidates: pipelinesQuery,
			onMutate: (pipelineSlug) => optimistic.remove(pipelineSlug),
			onError: (_error, pipelineSlug) => optimistic.restore(pipelineSlug),
		},
	);

	return {
		// Query state
		pipelines: optimistic.items,
		isLoading: pipelinesQuery.isLoading,
		error: pipelinesQuery.error,
		refresh: pipelinesQuery.refresh,
		getPipeline,

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
