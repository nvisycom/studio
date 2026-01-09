import { useQuery, useMutation } from "@pinia/colada";
import type {
	Invite,
	CreateInvite,
	GenerateInviteCode,
	InviteCode,
	ListInvites,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace invitation operations
 */
export function useInvites(query?: Ref<ListInvites>) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const invitesQuery = useQuery({
		key: () => [
			"invites",
			currentWorkspaceId.value,
			JSON.stringify(query?.value),
		],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			const result = await client.invites.listInvites(
				workspaceId,
				query?.value ?? { limit: 500 },
			);
			return result.items;
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
		staleTime: 0,
	});

	const sendInviteMutation = useMutation({
		mutation: async (invite: CreateInvite) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			return await client.invites.sendInvite(workspaceId, invite);
		},
		onSuccess() {
			invitesQuery.refresh();
		},
	});

	const cancelInviteMutation = useMutation({
		mutation: async (inviteId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.invites.cancelInvite(inviteId);
		},
		onSuccess() {
			invitesQuery.refresh();
		},
	});

	const generateCodeMutation = useMutation({
		mutation: async (options: GenerateInviteCode) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			return await client.invites.generateInviteCode(workspaceId, options);
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
