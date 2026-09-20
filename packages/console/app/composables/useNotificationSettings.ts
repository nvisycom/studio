import type { UpdateWorkspaceNotificationSettings } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace notification settings operations
 */
export function useNotificationSettings() {
	const settingsQuery = workspaceQuery(
		"notificationSettings",
		({ client, workspaceId }) =>
			client.workspaces.getNotificationSettings(workspaceId),
	);

	const updateSettingsMutation = workspaceMutation(
		({ client, workspaceId }, settings: UpdateWorkspaceNotificationSettings) =>
			client.workspaces.updateNotificationSettings(workspaceId, settings),
		{ invalidates: "notificationSettings" },
	);

	return {
		// Query state
		settings: settingsQuery.data,
		isLoading: settingsQuery.isLoading,
		error: settingsQuery.error,
		refresh: settingsQuery.refresh,

		// Update settings
		updateSettings: updateSettingsMutation.mutate,
		updateSettingsAsync: updateSettingsMutation.mutateAsync,
		isUpdating: updateSettingsMutation.isLoading,
		updateError: updateSettingsMutation.error,
	};
}
