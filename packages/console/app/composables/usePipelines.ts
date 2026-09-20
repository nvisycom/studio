import type {
	CreateWorkspacePipeline,
	UpdateWorkspacePipeline,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for pipeline operations
 */
export function usePipelines() {
	const { requireContext } = useWorkspaceContext();

	const pipelinesQuery = workspaceQuery(
		"pipelines",
		({ client, workspaceId }) =>
			fetchAllPages((after) =>
				client.pipelines.listPipelines(workspaceId, { after }),
			),
	);

	// Pipelines are keyed by slug; a delete drops the row immediately.
	const optimistic = useOptimisticList(pipelinesQuery.data, (p) => p.id);

	// Fetch a single pipeline with its full definition + retention (the list only
	// returns summaries).
	async function getPipeline(pipelineId: string) {
		const { client, workspaceId } = requireContext();
		return await client.pipelines.getPipeline(workspaceId, pipelineId);
	}

	const createPipelineMutation = workspaceMutation(
		({ client, workspaceId }, pipeline: CreateWorkspacePipeline) =>
			client.pipelines.createPipeline(workspaceId, pipeline),
		{ invalidates: "pipelines" },
	);

	const updatePipelineMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				pipelineId,
				updates,
			}: { pipelineId: string; updates: UpdateWorkspacePipeline },
		) => client.pipelines.updatePipeline(workspaceId, pipelineId, updates),
		{ invalidates: "pipelines" },
	);

	const deletePipelineMutation = workspaceMutation(
		({ client, workspaceId }, pipelineId: string) =>
			client.pipelines.deletePipeline(workspaceId, pipelineId),
		{
			invalidates: "pipelines",
			onMutate: (pipelineId) => optimistic.remove(pipelineId),
			onError: (_error, pipelineId) => optimistic.restore(pipelineId),
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
