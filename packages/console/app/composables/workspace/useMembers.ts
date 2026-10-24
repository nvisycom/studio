import type {
	UpdateWorkspaceMember,
	ListWorkspaceMembers,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace member operations
 */
export function useMembers(query?: MaybeRef<ListWorkspaceMembers>) {
	const { currentWorkspaceId } = useWorkspaceContext();

	const membersQuery = workspaceQuery(
		"members",
		async ({ client, workspaceId }) => {
			const result = await client.members.listMembers(
				workspaceId,
				toValue(query),
			);
			return result.items;
		},
		{
			key: () => [
				"members",
				currentWorkspaceId.value,
				JSON.stringify(toValue(query) ?? null),
			],
			staleTime: 0,
		},
	);

	// Members are keyed by username; a remove drops the row immediately.
	const optimistic = useOptimisticList(membersQuery.data, (m) => m.username);

	const updateMemberMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				username,
				updates,
			}: { username: string; updates: UpdateWorkspaceMember },
		) => client.members.updateMember(workspaceId, username, updates),
		{ invalidates: "members" },
	);

	const removeMemberMutation = workspaceMutation(
		({ client, workspaceId }, username: string) =>
			client.members.removeMember(workspaceId, username),
		{
			invalidates: "members",
			onMutate: (username) => optimistic.remove(username),
			onError: (_error, username) => optimistic.restore(username),
		},
	);

	const leaveMutation = workspaceMutation(
		({ client, workspaceId }) => client.members.leaveWorkspace(workspaceId),
		{ invalidates: "members" },
	);

	return {
		// Query state
		members: optimistic.items,
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
