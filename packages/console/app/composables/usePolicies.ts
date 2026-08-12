import type { CreatePolicy, UpdatePolicy } from "@nvisy/sdk/datatypes";

/**
 * Composable for policy operations (workspace-scoped).
 */
export function usePolicies() {
	const { requireContext } = useWorkspaceContext();

	const policiesQuery = workspaceQuery(
		"policies",
		async ({ client, workspaceSlug }) => {
			const result = await client.policies.listPolicies(workspaceSlug);
			return result.items;
		},
	);

	// Policies are keyed by slug; a delete drops the row immediately.
	const optimistic = useOptimisticList(policiesQuery.data, (p) => p.slug);

	// Fetch a single policy with its full definition (the list only returns
	// summaries).
	async function getPolicy(policySlug: string) {
		const { client, workspaceSlug } = requireContext();
		return await client.policies.getPolicy(workspaceSlug, policySlug);
	}

	const createPolicyMutation = workspaceMutation(
		({ client, workspaceSlug }, policy: CreatePolicy) =>
			client.policies.createPolicy(workspaceSlug, policy),
		{ invalidates: "policies" },
	);

	const updatePolicyMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ policySlug, updates }: { policySlug: string; updates: UpdatePolicy },
		) => client.policies.updatePolicy(workspaceSlug, policySlug, updates),
		{ invalidates: "policies" },
	);

	const deletePolicyMutation = workspaceMutation(
		({ client, workspaceSlug }, policySlug: string) =>
			client.policies.deletePolicy(workspaceSlug, policySlug),
		{
			invalidates: "policies",
			onMutate: (policySlug) => optimistic.remove(policySlug),
			onError: (_error, policySlug) => optimistic.restore(policySlug),
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
