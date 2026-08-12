import type { UpdateNotificationSettings } from "@nvisy/sdk/datatypes";

/**
 * Composable for workspace notification settings operations
 */
export function useNotificationSettings() {
	const settingsQuery = workspaceQuery(
		"notificationSettings",
		({ client, workspaceSlug }) =>
			client.workspaces.getNotificationSettings(workspaceSlug),
	);

	const updateSettingsMutation = workspaceMutation(
		({ client, workspaceSlug }, settings: UpdateNotificationSettings) =>
			client.workspaces.updateNotificationSettings(workspaceSlug, settings),
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
