import { tryOnScopeDispose } from "@vueuse/core";
import type { Notification } from "@nvisy/sdk/datatypes";

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
 *
 * The stream and unread count are module-level singletons: there's one account,
 * one stream, one source of truth — so every caller (the bell, and the desktop
 * shell mirroring notifications natively) sees the same state without opening
 * duplicate streams. When the count *rises*, a new notification arrived; we fetch
 * the newest and emit them to `onArrival` subscribers.
 */

// --- Singleton stream state ---
const unreadCount = ref(0);
const arrivalHandlers = new Set<(n: Notification) => void>();
// The newest notification id we've already emitted, so a count rise only emits
// what's actually new (the stream carries a count, not the notification itself).
let lastEmittedId: string | null = null;
let seededArrivals = false;
let streamStarted = false;

export function useNotifications() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const isAuthenticated = () => !!authToken.value?.apiToken;

	function requireClient() {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		return client;
	}

	// Fetch the latest notifications and emit any newer than the last we emitted,
	// oldest-first so subscribers see them in arrival order. Runs on a count rise.
	async function emitNewArrivals() {
		if (arrivalHandlers.size === 0) return;
		let items: Notification[];
		try {
			items = (await requireClient().notifications.listNotifications()).items;
		} catch {
			return; // best-effort; the badge count is still correct
		}
		// The list is newest-first. On the first run just record the head as the
		// baseline, so we don't replay the backlog as "just arrived".
		if (!seededArrivals) {
			seededArrivals = true;
			lastEmittedId = items[0]?.id ?? null;
			return;
		}
		const fresh: Notification[] = [];
		for (const n of items) {
			if (n.id === lastEmittedId) break;
			fresh.push(n);
		}
		if (items[0]) lastEmittedId = items[0].id;
		for (const n of fresh.reverse()) {
			for (const handler of arrivalHandlers) handler(n);
		}
	}

	// Start the shared stream once, reconnecting if it drops. A count rise (more
	// unread than before) means new notifications arrived → emit them.
	function startStream() {
		if (streamStarted) return;
		streamStarted = true;
		let stopped = false;
		let retryTimer: ReturnType<typeof setTimeout> | undefined;

		async function subscribe() {
			while (!stopped) {
				if (!isAuthenticated()) break;
				try {
					for await (const event of requireClient().notifications.streamEvents()) {
						if (stopped) break;
						const rose = event.unreadCount > unreadCount.value;
						unreadCount.value = event.unreadCount;
						if (rose) void emitNewArrivals();
					}
				} catch {
					// Swallow — a dropped/failed stream is retried below.
				}
				if (stopped) break;
				await new Promise<void>((resolve) => {
					retryTimer = setTimeout(resolve, STREAM_RETRY_MS);
				});
			}
		}

		watch(
			() => authToken.value?.apiToken,
			(token) => {
				if (token) subscribe();
			},
			{ immediate: true },
		);

		// The stream lives for the app's lifetime (account-global). Stop it only if
		// the whole app tears down.
		tryOnScopeDispose?.(() => {
			stopped = true;
			if (retryTimer) clearTimeout(retryTimer);
		});
	}

	startStream();

	/**
	 * Subscribe to newly-arrived notifications (e.g. the desktop shell mirrors
	 * them as native OS notifications). Auto-unsubscribes on scope dispose.
	 */
	function onArrival(handler: (n: Notification) => void) {
		arrivalHandlers.add(handler);
		onScopeDispose(() => arrivalHandlers.delete(handler));
	}

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
		unreadCount: readonly(unreadCount),
		onArrival,
		open,
	};
}
