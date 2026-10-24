import type {
	CreateWorkspacePolicy,
	UpdateWorkspacePolicy,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for policy operations (workspace-scoped).
 */
export function usePolicies() {
	const { requireRepository } = useWorkspaceContext();

	// The policies page shows the whole list, so flatten every page. The
	// repository's `listPolicies` is paginated (local or server); `fetchAllPages`
	// follows the cursor until the list is exhausted.
	const policiesQuery = repositoryQuery(
		"policies",
		({ repository, workspaceId }) =>
			fetchAllPages((after) =>
				repository.policies.listPolicies(workspaceId, { after }),
			),
	);

	// Policies are keyed by slug; a delete drops the row immediately.
	const optimistic = useOptimisticList(policiesQuery.data, (p) => p.id);

	// Fetch a single policy with its full definition (the list only returns
	// summaries).
	async function getPolicy(policyId: string) {
		const { repository, workspaceId } = requireRepository();
		return await repository.policies.getPolicy(workspaceId, policyId);
	}

	const createPolicyMutation = repositoryMutation(
		({ repository, workspaceId }, policy: CreateWorkspacePolicy) =>
			repository.policies.createPolicy(workspaceId, policy),
		{ invalidates: "policies" },
	);

	const updatePolicyMutation = repositoryMutation(
		(
			{ repository, workspaceId },
			{
				policyId,
				updates,
			}: { policyId: string; updates: UpdateWorkspacePolicy },
		) => repository.policies.updatePolicy(workspaceId, policyId, updates),
		{ invalidates: "policies" },
	);

	const deletePolicyMutation = repositoryMutation(
		({ repository, workspaceId }, policyId: string) =>
			repository.policies.deletePolicy(workspaceId, policyId),
		{
			invalidates: "policies",
			onMutate: (policyId) => optimistic.remove(policyId),
			onError: (_error, policyId) => optimistic.restore(policyId),
		},
	);

	// Promote a derived (ad-hoc) policy to an authored one: it becomes editable and
	// attachable to pipelines, keeping its id and definition, with a real name.
	const promotePolicyMutation = repositoryMutation(
		(
			{ repository, workspaceId },
			{ policyId, displayName }: { policyId: string; displayName: string },
		) =>
			repository.policies.promotePolicy(workspaceId, policyId, { displayName }),
		{ invalidates: "policies" },
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

		promotePolicy: promotePolicyMutation.mutate,
		promotePolicyAsync: promotePolicyMutation.mutateAsync,
		isPromoting: promotePolicyMutation.isLoading,
		promoteError: promotePolicyMutation.error,
	};
}
