import type { CreateWorkspace, UpdateWorkspace } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace operations
 */
export function useWorkspaces() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const route = useRoute();

	// The URL is the source of truth for the active workspace: feature routes
	// live under /w/[workspace]/... The cookie only remembers the last-used slug
	// so bare routes (e.g. "/") can redirect into a workspace.
	const lastWorkspaceSlug = useCookie<string | null>("current_workspace_slug", {
		default: () => null,
	});

	const currentWorkspaceSlug = computed<string | null>(() => {
		const param = route.params.workspace;
		return typeof param === "string" && param.length > 0 ? param : null;
	});

	// Mirror the active slug into the cookie so it is available for redirects.
	watch(
		currentWorkspaceSlug,
		(slug) => {
			if (slug) lastWorkspaceSlug.value = slug;
		},
		{ immediate: true },
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
		async onSuccess(data) {
			// Await the refetch so the list contains the new workspace *before*
			// we navigate — otherwise the /w/[workspace] guard in the default
			// layout sees a slug that isn't in the (stale) list, and the "/"
			// resolver may redirect elsewhere, leaving the user stranded until a
			// manual refresh.
			await workspacesQuery.refresh();
			navigateTo(`/w/${data.slug}`, { replace: true });
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
		async onSuccess(_data, deletedSlug) {
			// Await the refetch so `data` reflects the deletion before we choose
			// where to go — otherwise we'd pick the "next" workspace from a stale
			// list (still containing the deleted one) and navigate before the
			// guard's list catches up, stranding the user until a manual refresh.
			await workspacesQuery.refresh();
			// If the deleted workspace is the one in the URL, move to another.
			if (currentWorkspaceSlug.value === deletedSlug) {
				const next = workspacesQuery.data.value?.find(
					(w) => w.slug !== deletedSlug,
				);
				navigateTo(next ? `/w/${next.slug}` : "/", { replace: true });
			}
		},
	});

	const uploadAvatarMutation = useMutation({
		mutation: async ({
			workspaceSlug,
			avatar,
		}: {
			workspaceSlug: string;
			avatar: Blob;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.uploadAvatar(workspaceSlug, avatar);
		},
		onSuccess() {
			workspacesQuery.refresh();
		},
	});

	const deleteAvatarMutation = useMutation({
		mutation: async (workspaceSlug: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.workspaces.deleteAvatar(workspaceSlug);
		},
		onSuccess() {
			workspacesQuery.refresh();
		},
	});

	// Switch workspaces by navigating: swap the /w/[workspace] segment in the
	// current path so the user stays on the same sub-page where possible.
	function selectWorkspace(workspaceSlug: string) {
		const current = currentWorkspaceSlug.value;
		const target = current
			? route.fullPath.replace(`/w/${current}`, `/w/${workspaceSlug}`)
			: `/w/${workspaceSlug}`;
		navigateTo(target);
	}

	return {
		// Query state
		workspaces: workspacesQuery.data,
		isLoading: workspacesQuery.isLoading,
		error: workspacesQuery.error,
		refresh: workspacesQuery.refresh,

		// Current workspace (derived from the /w/[workspace] route param)
		currentWorkspaceSlug,
		lastWorkspaceSlug,
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

		// Avatar (logo)
		uploadAvatarAsync: uploadAvatarMutation.mutateAsync,
		isUploadingAvatar: uploadAvatarMutation.isLoading,
		deleteAvatarAsync: deleteAvatarMutation.mutateAsync,
		isDeletingAvatar: deleteAvatarMutation.isLoading,
	};
}
