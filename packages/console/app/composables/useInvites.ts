import type {
	CreateWorkspaceInvite,
	GenerateWorkspaceInviteCode,
	ListWorkspaceInvites,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace invitation operations
 */
export function useInvites(query?: MaybeRef<ListWorkspaceInvites>) {
	const { currentWorkspaceId } = useWorkspaceContext();

	const invitesQuery = workspaceQuery(
		"invites",
		({ client, workspaceId }) =>
			fetchAllPages((after) =>
				client.invites.listInvites(workspaceId, {
					...toValue(query),
					after,
				}),
			),
		{
			key: () => [
				"invites",
				currentWorkspaceId.value,
				JSON.stringify(toValue(query) ?? null),
			],
			staleTime: 0,
		},
	);

	// Invites are keyed by inviteId; a cancel drops the row immediately.
	const optimistic = useOptimisticList(invitesQuery.data, (i) => i.inviteId);

	const sendInviteMutation = workspaceMutation(
		({ client, workspaceId }, invite: CreateWorkspaceInvite) =>
			client.invites.sendInvite(workspaceId, invite),
		{ invalidates: "invites" },
	);

	const cancelInviteMutation = workspaceMutation(
		({ client, workspaceId }, inviteId: string) =>
			client.invites.cancelInvite(workspaceId, inviteId),
		{
			invalidates: "invites",
			onMutate: (inviteId) => optimistic.remove(inviteId),
			onError: (_error, inviteId) => optimistic.restore(inviteId),
		},
	);

	const generateCodeMutation = workspaceMutation(
		({ client, workspaceId }, options: GenerateWorkspaceInviteCode) =>
			client.invites.generateInviteCode(workspaceId, options),
	);

	return {
		// Query state
		invites: optimistic.items,
		isLoading: invitesQuery.isLoading,
		error: invitesQuery.error,
		refresh: invitesQuery.refresh,

		// Send invite
		sendInvite: sendInviteMutation.mutate,
		sendInviteAsync: sendInviteMutation.mutateAsync,
		isSending: sendInviteMutation.isLoading,
		sendError: sendInviteMutation.error,

		// Cancel invite
		cancelInvite: cancelInviteMutation.mutate,
		cancelInviteAsync: cancelInviteMutation.mutateAsync,
		isCanceling: cancelInviteMutation.isLoading,
		cancelError: cancelInviteMutation.error,

		// Generate code
		generateCode: generateCodeMutation.mutate,
		generateCodeAsync: generateCodeMutation.mutateAsync,
		isGenerating: generateCodeMutation.isLoading,
		generateError: generateCodeMutation.error,
	};
}
