import type { CreateWorkspace, UpdateWorkspace } from "@nvisy/sdk/datatypes";
import { isLocalWorkspace } from "#console/repositories/types";

/**
 * Composable for workspace operations
 */
export function useWorkspaces() {
	const { $nvisyClient } = useNuxtApp();
	const { list } = useWorkspaceList();
	const route = useRoute();

	/** The workspace-lifecycle backend, or throw the one canonical error. */
	function requireList() {
		const backend = list.value;
		if (!backend) throw new Error("No data source available");
		return backend;
	}

	/**
	 * The SDK client, for the few workspace operations not in the seam (avatars).
	 * These are server-only — there is no local avatar store — so they require a
	 * session.
	 */
	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

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

	const { isAuthenticated } = useAuth();
	const workspacesQuery = useQuery({
		// Key on the session too: on desktop the list is a union that grows when
		// signed in, so the logged-out (local-only) and signed-in (local + server)
		// lists must cache separately — otherwise a stale local-only result could
		// survive sign-in.
		key: () => ["workspaces", isAuthenticated.value],
		query: () =>
			fetchAllPages((after) =>
				requireList().workspaces.listWorkspaces({ after }),
			),
		// A data source is enough: the local store needs no session, so the
		// desktop app lists its workspaces logged out.
		enabled: () => !!list.value,
	});

	const currentWorkspace = computed(() => {
		if (!workspacesQuery.data.value || !currentWorkspaceSlug.value) return null;
		return (
			workspacesQuery.data.value.find(
				(w) => w.handle === currentWorkspaceSlug.value,
			) ?? null
		);
	});

	// The active workspace's id — what every workspace-scoped SDK call now takes
	// (the slug stays in the URL, display-only). Null until the workspace list
	// resolves and the route slug matches a workspace.
	const currentWorkspaceId = computed<string | null>(
		() => currentWorkspace.value?.id ?? null,
	);

	// Whether the active workspace is a local folder-workspace (vs. a server
	// one). This is the axis the data-surface chrome gates on — a local workspace
	// hides server-only nav/settings regardless of session, and a server
	// workspace shows them even on desktop. Distinct from the session axis
	// (`useAuth().isAuthenticated`), which drives the account chip and connect.
	const currentWorkspaceIsLocal = computed(() =>
		isLocalWorkspace(currentWorkspace.value),
	);

	const createWorkspaceMutation = useMutation({
		mutation: async (workspace: CreateWorkspace) => {
			return await requireList().workspaces.createWorkspace(workspace);
		},
		async onSuccess(data) {
			// Force a refetch (not refresh) so the list contains the new
			// workspace *before* we navigate. `refresh()` is stale-gated: if
			// colada still considers the cached list fresh it resolves WITHOUT
			// refetching, returning the old (often empty) list — so the
			// /w/[workspace] guard sees a slug the list lacks and the "/"
			// resolver bounces the user back to onboarding until a manual
			// refresh. `refetch()` always hits the network.
			await workspacesQuery.refetch();
			navigateTo(`/w/${data.handle}`, { replace: true });
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
			return await requireList().workspaces.updateWorkspace(
				workspaceId,
				updates,
			);
		},
		onSuccess() {
			workspacesQuery.refetch();
		},
	});

	const deleteWorkspaceMutation = useMutation({
		mutation: async (workspaceId: string) => {
			await requireList().workspaces.deleteWorkspace(workspaceId);
		},
		async onSuccess(_data, deletedId) {
			// Capture whether we were viewing the deleted workspace BEFORE the
			// refetch — afterwards it's gone from `data`, so `currentWorkspace`
			// (matched off the list by the URL handle) is null and the check
			// below would never fire.
			const wasCurrentWorkspace = currentWorkspace.value?.id === deletedId;
			// Force a refetch (not the stale-gated refresh) so `data` reflects
			// the deletion before we choose where to go — otherwise we'd pick the
			// "next" workspace from a stale list (still containing the deleted
			// one) and navigate before the guard's list catches up, stranding the
			// user until a manual refresh.
			await workspacesQuery.refetch();
			// If the deleted workspace is the one in the URL, move to another.
			if (wasCurrentWorkspace) {
				const next = workspacesQuery.data.value?.find(
					(w) => w.id !== deletedId,
				);
				navigateTo(next ? `/w/${next.handle}` : "/", { replace: true });
			}
		},
	});

	const uploadAvatarMutation = useMutation({
		mutation: async ({
			workspaceId,
			avatar,
		}: {
			workspaceId: string;
			avatar: Blob;
		}) => {
			return await requireClient().workspaces.uploadAvatar(workspaceId, avatar);
		},
		onSuccess() {
			workspacesQuery.refetch();
		},
	});

	const deleteAvatarMutation = useMutation({
		mutation: async (workspaceId: string) => {
			return await requireClient().workspaces.deleteAvatar(workspaceId);
		},
		onSuccess() {
			workspacesQuery.refetch();
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
		// Unconditional refetch (bypasses refresh()'s stale gate) for callers
		// that must observe fresh data before acting on it.
		refetch: workspacesQuery.refetch,

		// Current workspace (derived from the /w/[workspace] route param). The slug
		// stays in the URL (display-only); `currentWorkspaceId` is what SDK calls take.
		currentWorkspaceSlug,
		currentWorkspaceId,
		currentWorkspaceIsLocal,
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
