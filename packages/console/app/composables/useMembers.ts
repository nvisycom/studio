import type { UpdateMember, ListMembers } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace member operations
 */
export function useMembers(query?: MaybeRef<ListMembers>) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const membersQuery = useQuery({
		key: () => [
			"members",
			currentWorkspaceSlug.value,
			JSON.stringify(toValue(query)),
		],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			const result = await client.members.listMembers(
				workspaceSlug,
				toValue(query),
			);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
		staleTime: 0,
	});

	const updateMemberMutation = useMutation({
		mutation: async ({
			username,
			updates,
		}: {
			username: string;
			updates: UpdateMember;
		}) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			return await client.members.updateMember(
				workspaceSlug,
				username,
				updates,
			);
		},
		onSuccess() {
			membersQuery.refresh();
		},
	});

	const removeMemberMutation = useMutation({
		mutation: async (username: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			await client.members.removeMember(workspaceSlug, username);
		},
		onSuccess() {
			membersQuery.refresh();
		},
	});

	const leaveMutation = useMutation({
		mutation: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			await client.members.leaveWorkspace(workspaceSlug);
		},
		onSuccess() {
			membersQuery.refresh();
		},
	});

	return {
		// Query state
		members: membersQuery.data,
		isLoading: membersQuery.isLoading,
		error: membersQuery.error,
		refresh: membersQuery.refresh,

		// Update member
		updateMember: updateMemberMutation.mutate,
		updateMemberAsync: updateMemberMutation.mutateAsync,
		isUpdatingMember: updateMemberMutation.isLoading,
		updateMemberError: updateMemberMutation.error,

		// Remove member
		removeMember: removeMemberMutation.mutate,
		removeMemberAsync: removeMemberMutation.mutateAsync,
		isRemoving: removeMemberMutation.isLoading,
		removeError: removeMemberMutation.error,

		// Leave workspace
		leave: leaveMutation.mutate,
		leaveAsync: leaveMutation.mutateAsync,
		isLeaving: leaveMutation.isLoading,
		leaveError: leaveMutation.error,
	};
}
