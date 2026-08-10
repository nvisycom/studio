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

	const sendInviteMutation = workspaceMutation(
		({ client, workspaceSlug }, invite: CreateInvite) =>
			client.invites.sendInvite(workspaceSlug, invite),
		{ invalidates: invitesQuery },
	);

	const cancelInviteMutation = workspaceMutation(
		({ client, workspaceSlug }, inviteId: string) =>
			client.invites.cancelInvite(workspaceSlug, inviteId),
		{ invalidates: invitesQuery },
	);

	const generateCodeMutation = workspaceMutation(
		({ client, workspaceSlug }, options: GenerateInviteCode) =>
			client.invites.generateInviteCode(workspaceSlug, options),
	);

	return {
		// Query state
		invites: invitesQuery.data,
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
