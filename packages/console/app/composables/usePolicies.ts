import type { CreatePolicy, UpdatePolicy } from "@nvisy/sdk/datatypes";

/**
 * Composable for policy operations (workspace-scoped).
 */
export function usePolicies() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const policiesQuery = useQuery({
		key: () => ["policies", currentWorkspaceSlug.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const result = await client.policies.listPolicies(workspaceSlug);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
	});

	const createPolicyMutation = useMutation({
		mutation: async (policy: CreatePolicy) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.policies.createPolicy(workspaceSlug, policy);
		},
		onSuccess() {
			policiesQuery.refresh();
		},
	});

	const updatePolicyMutation = useMutation({
		mutation: async ({
			policySlug,
			updates,
		}: {
			policySlug: string;
			updates: UpdatePolicy;
		}) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.policies.updatePolicy(
				workspaceSlug,
				policySlug,
				updates,
			);
		},
		onSuccess() {
			policiesQuery.refresh();
		},
	});

	const deletePolicyMutation = useMutation({
		mutation: async (policySlug: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			await client.policies.deletePolicy(workspaceSlug, policySlug);
		},
		onSuccess() {
			policiesQuery.refresh();
		},
	});

	return {
		policies: policiesQuery.data,
		isLoading: policiesQuery.isLoading,
		error: policiesQuery.error,
		refresh: policiesQuery.refresh,

		createPolicy: createPolicyMutation.mutate,
		createPolicyAsync: createPolicyMutation.mutateAsync,
		isCreating: createPolicyMutation.isLoading,

		updatePolicy: updatePolicyMutation.mutate,
		updatePolicyAsync: updatePolicyMutation.mutateAsync,
		isUpdating: updatePolicyMutation.isLoading,

		deletePolicy: deletePolicyMutation.mutate,
		deletePolicyAsync: deletePolicyMutation.mutateAsync,
		isDeleting: deletePolicyMutation.isLoading,
	};
}
