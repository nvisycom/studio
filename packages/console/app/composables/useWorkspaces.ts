import type { CreateWorkspace, UpdateWorkspace } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace operations
 */
export function useWorkspaces() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const currentWorkspaceSlug = useCookie<string | null>(
		"current_workspace_slug",
		{
			default: () => null,
		},
	);

	const workspacesQuery = useQuery({
		key: ["workspaces"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.workspaces.listWorkspaces();
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	// Auto-select first workspace if none selected, or clear invalid workspace slug
	watch(
		() => workspacesQuery.data.value,
		(workspaces) => {
			if (!workspaces) return;

			// If user has no workspaces, clear the cookie
			if (workspaces.length === 0) {
				currentWorkspaceSlug.value = null;
				return;
			}

			// If no workspace selected, select the first one
			if (!currentWorkspaceSlug.value) {
				currentWorkspaceSlug.value = workspaces[0]?.slug ?? null;
				return;
			}

			// If stored slug doesn't exist in user's workspaces, select the first one
			const workspaceExists = workspaces.some(
				(w) => w.slug === currentWorkspaceSlug.value,
			);
			if (!workspaceExists) {
				currentWorkspaceSlug.value = workspaces[0]?.slug ?? null;
			}
		},
		{ immediate: true },
	);

	const currentWorkspace = computed(() => {
		if (!workspacesQuery.data.value || !currentWorkspaceSlug.value) return null;
		return (
			workspacesQuery.data.value.find(
				(w) => w.slug === currentWorkspaceSlug.value,
			) ?? null
		);
	});

	const createWorkspaceMutation = useMutation({
		mutation: async (workspace: CreateWorkspace) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.createWorkspace(workspace);
		},
		onSuccess(data) {
			workspacesQuery.refresh();
			currentWorkspaceSlug.value = data.slug;
		},
	});

	const updateWorkspaceMutation = useMutation({
		mutation: async ({
			workspaceSlug,
			updates,
		}: {
			workspaceSlug: string;
			updates: UpdateWorkspace;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.updateWorkspace(workspaceSlug, updates);
		},
		onSuccess() {
			workspacesQuery.refresh();
		},
	});

	const deleteWorkspaceMutation = useMutation({
		mutation: async (workspaceSlug: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.workspaces.deleteWorkspace(workspaceSlug);
		},
		onSuccess() {
			workspacesQuery.refresh();
			if (currentWorkspaceSlug.value) {
				const remaining = workspacesQuery.data.value?.filter(
					(w) => w.slug !== currentWorkspaceSlug.value,
				);
				currentWorkspaceSlug.value =
					remaining && remaining.length > 0
						? (remaining[0]?.slug ?? null)
						: null;
			}
		},
	});

	function selectWorkspace(workspaceSlug: string) {
		currentWorkspaceSlug.value = workspaceSlug;
	}

	return {
		// Query state
		workspaces: workspacesQuery.data,
		isLoading: workspacesQuery.isLoading,
		error: workspacesQuery.error,
		refresh: workspacesQuery.refresh,

		// Current workspace
		currentWorkspaceSlug: readonly(currentWorkspaceSlug),
		currentWorkspace,
		selectWorkspace,

		// Create
		createWorkspace: createWorkspaceMutation.mutate,
		createWorkspaceAsync: createWorkspaceMutation.mutateAsync,
		isCreating: createWorkspaceMutation.isLoading,
		createError: createWorkspaceMutation.error,

		// Update
		updateWorkspace: updateWorkspaceMutation.mutate,
		updateWorkspaceAsync: updateWorkspaceMutation.mutateAsync,
		isUpdating: updateWorkspaceMutation.isLoading,
		updateError: updateWorkspaceMutation.error,

		// Delete
		deleteWorkspace: deleteWorkspaceMutation.mutate,
		deleteWorkspaceAsync: deleteWorkspaceMutation.mutateAsync,
		isDeleting: deleteWorkspaceMutation.isLoading,
		deleteError: deleteWorkspaceMutation.error,
	};
}
