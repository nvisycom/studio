import { useDocumentVisibility, useIntervalFn } from "@vueuse/core";

// Notifications are occasional, one-way events (not a chat stream), so the
// badge follows the polling pattern GitHub uses rather than a socket: colada
// refetches the count on tab focus, and the interval below tops that up while
// the tab stays visible.
const UNREAD_POLL_MS = 30_000;

/**
 * Account-global notifications (the header bell), backed by the SDK's
 * account-scoped `/notifications/` endpoints — not workspace-scoped.
 *
 * Two queries back the bell: a cheap unread-count poll that drives the badge,
 * and the notification list itself, fetched lazily when the dropdown opens.
 * Opening the dropdown also marks everything read, which clears the badge.
 */
export function useNotifications() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const queryCache = useQueryCache();

	const isAuthenticated = () => !!authToken.value?.apiToken;

	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

	// Unread count — drives the badge. Cheap enough to keep enabled.
	const unreadStatusQuery = useQuery({
		key: () => ["notifications", "unread-status"],
		query: () => requireClient().notifications.getUnreadNotificationsStatus(),
		enabled: isAuthenticated,
	});

	// Poll the count so a long-open tab stays fresh (colada already refetches on
	// focus; this covers the tab staying focused). Skip while hidden or logged
	// out — a background tab shouldn't generate traffic. The interval is cleared
	// automatically when the calling component's scope is disposed.
	const visibility = useDocumentVisibility();
	useIntervalFn(() => {
		if (visibility.value === "visible" && isAuthenticated()) {
			unreadStatusQuery.refetch();
		}
	}, UNREAD_POLL_MS);

	// The list itself. Fetched lazily (the dropdown calls `open()`), so it isn't
	// loaded on every page just to sit unopened behind the bell.
	const listQuery = useQuery({
		key: () => ["notifications", "list"],
		query: async () =>
			(await requireClient().notifications.listNotifications()).items,
		enabled: false,
	});

	const unreadCount = computed(
		() => unreadStatusQuery.data.value?.unreadCount ?? 0,
	);

	// Mark everything read, then refresh the badge so it clears. Kept resilient:
	// a failed mark-read still leaves the list shown.
	const markAllRead = useMutation({
		mutation: () => requireClient().notifications.markAllRead(),
		onSuccess() {
			queryCache.invalidateQueries({ key: ["notifications", "unread-status"] });
		},
	});

	/**
	 * Load the list for a freshly-opened dropdown and mark unread items read.
	 * Fetch first (so the panel shows what was unread), then clear the badge.
	 */
	async function open() {
		await listQuery.refresh();
		if (unreadCount.value > 0) await markAllRead.mutateAsync();
	}

	return {
		notifications: listQuery.data,
		isLoading: listQuery.isLoading,
		error: listQuery.error,
		unreadCount,
		open,
	};
}
