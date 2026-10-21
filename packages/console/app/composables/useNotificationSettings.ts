import type { UpdateWorkspaceNotificationSettings } from "@nvisy/sdk/datatypes";

/**
 * Workspace notification settings — which events fire a notification. Routed
 * through the repository seam, so a server workspace reads/writes the server's
 * settings and a local folder-workspace reads/writes on-device prefs (scoped to
 * the locally-meaningful pipeline events). The page is identical for both.
 */
export function useNotificationSettings() {
	const settingsQuery = repositoryQuery(
		"notificationSettings",
		({ repository, workspaceId }) =>
			repository.notificationSettings.getNotificationSettings(workspaceId),
	);

	const updateSettingsMutation = repositoryMutation(
		(
			{ repository, workspaceId },
			settings: UpdateWorkspaceNotificationSettings,
		) =>
			repository.notificationSettings.updateNotificationSettings(
				workspaceId,
				settings,
			),
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
