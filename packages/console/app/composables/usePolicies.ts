import type {
	CreateWorkspacePolicy,
	UpdateWorkspacePolicy,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for policy operations (workspace-scoped).
 */
export function usePolicies() {
	const { requireContext } = useWorkspaceContext();

	const policiesQuery = workspaceQuery("policies", ({ client, workspaceId }) =>
		fetchAllPages((after) =>
			client.policies.listPolicies(workspaceId, { after }),
		),
	);

	// Policies are keyed by slug; a delete drops the row immediately.
	const optimistic = useOptimisticList(policiesQuery.data, (p) => p.id);

	// Fetch a single policy with its full definition (the list only returns
	// summaries).
	async function getPolicy(policyId: string) {
		const { client, workspaceId } = requireContext();
		return await client.policies.getPolicy(workspaceId, policyId);
	}

	const createPolicyMutation = workspaceMutation(
		({ client, workspaceId }, policy: CreateWorkspacePolicy) =>
			client.policies.createPolicy(workspaceId, policy),
		{ invalidates: "policies" },
	);

	const updatePolicyMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				policyId,
				updates,
			}: { policyId: string; updates: UpdateWorkspacePolicy },
		) => client.policies.updatePolicy(workspaceId, policyId, updates),
		{ invalidates: "policies" },
	);

	const deletePolicyMutation = workspaceMutation(
		({ client, workspaceId }, policyId: string) =>
			client.policies.deletePolicy(workspaceId, policyId),
		{
			invalidates: "policies",
			onMutate: (policyId) => optimistic.remove(policyId),
			onError: (_error, policyId) => optimistic.restore(policyId),
		},
	);

	return {
		policies: optimistic.items,
		getPolicy,
		isLoading: policiesQuery.isLoading,
		error: policiesQuery.error,
		refresh: policiesQuery.refresh,

		createPolicy: createPolicyMutation.mutate,
		createPolicyAsync: createPolicyMutation.mutateAsync,
		isCreating: createPolicyMutation.isLoading,
		createError: createPolicyMutation.error,

		updatePolicy: updatePolicyMutation.mutate,
		updatePolicyAsync: updatePolicyMutation.mutateAsync,
		isUpdating: updatePolicyMutation.isLoading,
		updateError: updatePolicyMutation.error,

		deletePolicy: deletePolicyMutation.mutate,
		deletePolicyAsync: deletePolicyMutation.mutateAsync,
		isDeleting: deletePolicyMutation.isLoading,
		deleteError: deletePolicyMutation.error,
	};
}
