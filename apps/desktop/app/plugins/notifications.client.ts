import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Mirror the app's notifications onto the desktop shell: the account's unread
 * count as a tray badge, and each newly-arrived notification as a native OS
 * notification.
 *
 * Everything is driven off the shared notification stream (`useNotifications`),
 * so every notification type — detections, redactions, connection syncs, member
 * events — is delivered natively for free, and the per-event channel selection
 * in Settings governs what reaches the bell (and thus here). The native firing
 * honors the device toggle (enforced Rust-side in `notify`). On the web nothing
 * runs.
 */
export default defineNuxtPlugin((nuxtApp) => {
	if (!isTauri()) return;

	const i18n = nuxtApp.$i18n;
	const { unreadCount, onArrival } = useNotifications();

	// Tray badge = unread count, with a localized hover tooltip.
	watch(
		unreadCount,
		(count) => {
			const tooltip =
				count > 0
					? i18n.t("tray.unread", count, { named: { count } })
					: undefined;
			invoke("set_badge_count", { count, tooltip }).catch(() => {});
		},
		{ immediate: true },
	);

	// New notification -> native one, using the same copy the bell renders.
	onArrival((n) => {
		if (!n.payload) return;
		const { titleKey, messageKey, params } = notificationContent(n.payload);
		invoke("notify", {
			title: i18n.t(titleKey),
			body: i18n.t(messageKey, params),
		}).catch(() => {});
	});
});
