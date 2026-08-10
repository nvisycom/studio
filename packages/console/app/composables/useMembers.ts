import type { UpdateMember, ListMembers } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace member operations
 */
export function useMembers(query?: MaybeRef<ListMembers>) {
	const { currentWorkspaceSlug } = useWorkspaceContext();

	const membersQuery = workspaceQuery(
		"members",
		async ({ client, workspaceSlug }) => {
			const result = await client.members.listMembers(
				workspaceSlug,
				toValue(query),
			);
			return result.items;
		},
		{
			key: () => [
				"members",
				currentWorkspaceSlug.value,
				JSON.stringify(toValue(query) ?? null),
			],
			staleTime: 0,
		},
	);

	const updateMemberMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ username, updates }: { username: string; updates: UpdateMember },
		) => client.members.updateMember(workspaceSlug, username, updates),
		{ invalidates: membersQuery },
	);

	const removeMemberMutation = workspaceMutation(
		({ client, workspaceSlug }, username: string) =>
			client.members.removeMember(workspaceSlug, username),
		{ invalidates: membersQuery },
	);

	const leaveMutation = workspaceMutation(
		({ client, workspaceSlug }) => client.members.leaveWorkspace(workspaceSlug),
		{ invalidates: membersQuery },
	);

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
