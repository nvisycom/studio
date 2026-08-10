import type {
	CreateInvite,
	GenerateInviteCode,
	ListInvites,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace invitation operations
 */
export function useInvites(query?: MaybeRef<ListInvites>) {
	const { currentWorkspaceSlug } = useWorkspaceContext();

	const invitesQuery = workspaceQuery(
		"invites",
		async ({ client, workspaceSlug }) => {
			const result = await client.invites.listInvites(
				workspaceSlug,
				toValue(query) ?? { limit: 500 },
			);
			return result.items;
		},
		{
			key: () => [
				"invites",
				currentWorkspaceSlug.value,
				JSON.stringify(toValue(query) ?? null),
			],
			staleTime: 0,
		},
	);

	// Invites are keyed by inviteId; a cancel drops the row immediately.
	const optimistic = useOptimisticList(invitesQuery.data, (i) => i.inviteId);

	const sendInviteMutation = workspaceMutation(
		({ client, workspaceSlug }, invite: CreateInvite) =>
			client.invites.sendInvite(workspaceSlug, invite),
		{ invalidates: invitesQuery },
	);

	const cancelInviteMutation = workspaceMutation(
		({ client, workspaceSlug }, inviteId: string) =>
			client.invites.cancelInvite(workspaceSlug, inviteId),
		{
			invalidates: invitesQuery,
			onMutate: (inviteId) => optimistic.remove(inviteId),
			onError: (_error, inviteId) => optimistic.restore(inviteId),
		},
	);

	const generateCodeMutation = workspaceMutation(
		({ client, workspaceSlug }, options: GenerateInviteCode) =>
			client.invites.generateInviteCode(workspaceSlug, options),
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
