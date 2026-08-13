import { tryOnScopeDispose } from "@vueuse/core";

// How long to wait before reconnecting after the unread-count stream drops.
const STREAM_RETRY_MS = 5_000;

/**
 * Account-global notifications (the header bell), backed by the SDK's
 * account-scoped `/notifications/` endpoints — not workspace-scoped.
 *
 * The unread count is driven by a Server-Sent Events stream
 * (`notifications.streamEvents`), which yields the current count immediately
 * then pushes every change as notifications arrive or are marked read — so the
 * badge updates in real time with no polling. The notification list itself is
 * still fetched lazily when the dropdown opens; opening also marks everything
 * read, which the stream reflects by pushing a fresh (lower) count.
 */
export function useNotifications() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const isAuthenticated = () => !!authToken.value?.apiToken;

	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

	// --- Unread count (live over SSE) ---
	const unreadCount = ref(0);

	// Subscribe to the count stream while authenticated, reconnecting if it
	// drops. `stopped` breaks the loop on scope dispose so the stream closes.
	let stopped = false;
	let retryTimer: ReturnType<typeof setTimeout> | undefined;

	async function subscribe() {
		while (!stopped) {
			if (!isAuthenticated()) break;
			try {
				for await (const event of requireClient().notifications.streamEvents()) {
					if (stopped) break;
					unreadCount.value = event.unreadCount;
				}
			} catch {
				// Swallow — a dropped/failed stream is retried below.
			}
			if (stopped) break;
			// Stream closed or errored; wait, then reconnect.
			await new Promise<void>((resolve) => {
				retryTimer = setTimeout(resolve, STREAM_RETRY_MS);
			});
		}
	}

	// Start once authenticated. `immediate` covers the common case (the bell only
	// mounts inside the signed-in shell); the watch also starts it if a token
	// arrives later.
	let started = false;
	watch(
		() => authToken.value?.apiToken,
		(token) => {
			if (token && !started) {
				started = true;
				subscribe();
			}
		},
		{ immediate: true },
	);

	tryOnScopeDispose(() => {
		stopped = true;
		if (retryTimer) clearTimeout(retryTimer);
	});

	// --- Notification list (lazy) ---
	// Fetched when the dropdown opens, so it isn't loaded on every page just to
	// sit unopened behind the bell.
	const listQuery = useQuery({
		key: () => ["notifications", "list"],
		query: async () =>
			(await requireClient().notifications.listNotifications()).items,
		enabled: false,
	});

	// Mark everything read; the count stream reports the resulting change, so the
	// badge clears on its own. Kept resilient: a failed mark-read still leaves
	// the list shown.
	const markAllRead = useMutation({
		mutation: () => requireClient().notifications.markAllRead(),
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
