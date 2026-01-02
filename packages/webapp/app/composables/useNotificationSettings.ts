import { useQuery, useMutation } from "@pinia/colada";
import type {
  NotificationSettings,
  UpdateNotificationSettings,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace notification settings operations
 */
export function useNotificationSettings() {
  const { $nvisyClient } = useNuxtApp();
  const { authToken } = useAuth();
  const { currentWorkspaceId } = useWorkspaces();

  const notificationSettingsQuery = useQuery({
    key: () => ["notificationSettings", currentWorkspaceId.value],
    query: async () => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace selected");
      return await client.workspaces.getNotificationSettings(workspaceId);
    },
    enabled: () => !!authToken.value?.apiToken && !!currentWorkspaceId.value,
  });

  const updateSettingsMutation = useMutation({
    mutation: async (settings: UpdateNotificationSettings) => {
      const client = $nvisyClient.value;
      const workspaceId = currentWorkspaceId.value;
      if (!client) throw new Error("Not authenticated");
      if (!workspaceId) throw new Error("No workspace selected");
      return await client.workspaces.updateNotificationSettings(
        workspaceId,
        settings,
      );
    },
    onSuccess() {
      notificationSettingsQuery.refresh();
    },
  });

  return {
    // Query state
    settings: notificationSettingsQuery.data,
    isLoading: notificationSettingsQuery.isLoading,
    error: notificationSettingsQuery.error,
    refresh: notificationSettingsQuery.refresh,

    // Update settings
    updateSettings: updateSettingsMutation.mutate,
    updateSettingsAsync: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isLoading,
    updateError: updateSettingsMutation.error,
  };
}
