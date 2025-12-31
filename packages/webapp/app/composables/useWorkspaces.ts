import { useQuery, useMutation } from "@pinia/colada";
import type { Workspace, CreateWorkspace, UpdateWorkspace } from "@nvisy/sdk";

/**
 * Composable for workspace operations
 */
export function useWorkspaces() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const currentWorkspaceId = useCookie<string | null>("current_workspace_id", {
		default: () => null,
	});

	const workspacesQuery = useQuery({
		key: ["workspaces"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.list();
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	// Auto-select first workspace if none selected
	watch(
		() => workspacesQuery.data.value,
		(workspaces) => {
			if (workspaces && workspaces.length > 0 && !currentWorkspaceId.value) {
				currentWorkspaceId.value = workspaces[0]?.workspaceId ?? null;
			}
		},
		{ immediate: true },
	);

	const currentWorkspace = computed(() => {
		if (!workspacesQuery.data.value || !currentWorkspaceId.value) return null;
		return (
			workspacesQuery.data.value.find(
				(w) => w.workspaceId === currentWorkspaceId.value,
			) ?? null
		);
	});

	const createWorkspaceMutation = useMutation({
		mutation: async (workspace: CreateWorkspace) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.create(workspace);
		},
		onSuccess(data) {
			workspacesQuery.refresh();
			currentWorkspaceId.value = data.workspaceId;
		},
	});

	const updateWorkspaceMutation = useMutation({
		mutation: async ({
			workspaceId,
			updates,
		}: {
			workspaceId: string;
			updates: UpdateWorkspace;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.update(workspaceId, updates);
		},
		onSuccess() {
			workspacesQuery.refresh();
		},
	});

	const deleteWorkspaceMutation = useMutation({
		mutation: async (workspaceId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.workspaces.delete(workspaceId);
		},
		onSuccess() {
			workspacesQuery.refresh();
			if (currentWorkspaceId.value) {
				const remaining = workspacesQuery.data.value?.filter(
					(w) => w.workspaceId !== currentWorkspaceId.value,
				);
				currentWorkspaceId.value =
					remaining && remaining.length > 0
						? (remaining[0]?.workspaceId ?? null)
						: null;
			}
		},
	});

	function selectWorkspace(workspaceId: string) {
		currentWorkspaceId.value = workspaceId;
	}

	return {
		// Query state
		workspaces: workspacesQuery.data,
		isLoading: workspacesQuery.isLoading,
		error: workspacesQuery.error,
		refresh: workspacesQuery.refresh,

		// Current workspace
		currentWorkspaceId: readonly(currentWorkspaceId),
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
