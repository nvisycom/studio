import type { Notification } from "@nvisy/sdk/datatypes";

/**
 * Composable for notification operations
 */
export function useNotifications() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	// Fetch unread count without marking as read
	const unreadStatusQuery = useQuery({
		key: () => ["notifications", "unread-status"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.notifications.getUnreadNotificationsStatus();
		},
		enabled: () => !!authToken.value?.apiToken,
	});

	// Notifications list - only fetched when explicitly called
	const notificationsQuery = useQuery({
		key: () => ["notifications", "list"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.notifications.listNotifications();
			return result.items;
		},
		enabled: false, // Don't auto-fetch, marks as read
	});

	const unreadCount = computed(() => {
		return unreadStatusQuery.data.value?.unreadCount ?? 0;
	});

	async function fetchNotifications() {
		await notificationsQuery.refresh();
		// Refresh unread status after fetching (they're now marked as read)
		await unreadStatusQuery.refresh();
	}

	return {
		// Unread status
		unreadCount,
		isLoadingUnread: unreadStatusQuery.isLoading,
		refreshUnreadStatus: unreadStatusQuery.refresh,

		// Notifications list
		notifications: notificationsQuery.data,
		isLoading: notificationsQuery.isLoading,
		error: notificationsQuery.error,
		fetchNotifications,
	};
}
