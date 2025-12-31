import { useQuery, useMutation } from "@pinia/colada";
import type { Member, UpdateMemberRole } from "@nvisy/sdk";

/**
 * Composable for workspace member operations
 */
export function useMembers() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const membersQuery = useQuery({
		key: () => ["members", currentWorkspaceId.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			return await client.members.list(workspaceId);
		},
		enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
	});

	const updateRoleMutation = useMutation({
		mutation: async ({
			accountId,
			role,
		}: {
			accountId: string;
			role: UpdateMemberRole;
		}) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			return await client.members.updateRole(workspaceId, accountId, role);
		},
		onSuccess() {
			membersQuery.refresh();
		},
	});

	const removeMemberMutation = useMutation({
		mutation: async (accountId: string) => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			await client.members.remove(workspaceId, accountId);
		},
		onSuccess() {
			membersQuery.refresh();
		},
	});

	const leaveMutation = useMutation({
		mutation: async () => {
			const client = $nvisyClient.value;
			const workspaceId = currentWorkspaceId.value;
			if (!client) throw new Error("Not authenticated");
			if (!workspaceId) throw new Error("No workspace selected");
			await client.members.leave(workspaceId);
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

		// Update role
		updateRole: updateRoleMutation.mutate,
		updateRoleAsync: updateRoleMutation.mutateAsync,
		isUpdatingRole: updateRoleMutation.isLoading,
		updateRoleError: updateRoleMutation.error,

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
