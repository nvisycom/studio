import { useQuery, useMutation } from "@pinia/colada";
import type {
  Member,
  UpdateMember,
  ListMembersQuery,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace member operations
 */
export function useMembers(query?: Ref<ListMembersQuery>) {
  const { $nvisyClient } = useNuxtApp();
  const { authToken } = useAuth();
  const { currentWorkspaceId } = useWorkspaces();

  const membersQuery = useQuery({
    key: () => ["members", currentWorkspaceId.value, query?.value],
    query: async () => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace selected");
      return await client.members.listMembers(workspaceId, query?.value);
    },
    enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
  });

  const updateMemberMutation = useMutation({
    mutation: async ({
      accountId,
      updates,
    }: {
      accountId: string;
      updates: UpdateMember;
    }) => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace selected");
      return await client.members.updateMember(workspaceId, accountId, updates);
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
      await client.members.removeMember(workspaceId, accountId);
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
      await client.members.leaveWorkspace(workspaceId);
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
