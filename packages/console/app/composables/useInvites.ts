import type {
	CreateInvite,
	GenerateInviteCode,
	ListInvites,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace invitation operations
 */
export function useInvites(query?: MaybeRef<ListInvites>) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const invitesQuery = useQuery({
		key: () => [
			"invites",
			currentWorkspaceSlug.value,
			JSON.stringify(toValue(query)),
		],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			const result = await client.invites.listInvites(
				workspaceSlug,
				toValue(query) ?? { limit: 500 },
			);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceSlug.value,
		staleTime: 0,
	});

	const sendInviteMutation = useMutation({
		mutation: async (invite: CreateInvite) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			return await client.invites.sendInvite(workspaceSlug, invite);
		},
		onSuccess() {
			invitesQuery.refresh();
		},
	});

	const cancelInviteMutation = useMutation({
		mutation: async (inviteId: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			await client.invites.cancelInvite(workspaceSlug, inviteId);
		},
		onSuccess() {
			invitesQuery.refresh();
		},
	});

	const generateCodeMutation = useMutation({
		mutation: async (options: GenerateInviteCode) => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceSlug) throw new Error("No workspace selected");
			return await client.invites.generateInviteCode(workspaceSlug, options);
		},
	});

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
