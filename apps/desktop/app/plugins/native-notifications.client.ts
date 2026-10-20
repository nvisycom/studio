import { invoke, isTauri } from "@tauri-apps/api/core";
import type { WorkspaceNotificationSettings } from "@nvisy/sdk/datatypes";

/**
 * Fill the native-notification seam with the Tauri store commands, so the shared
 * Notifications settings page can read/toggle the desktop preference, and the
 * studio can fire a local-event notification, without importing Tauri.
 * `set_notifications_enabled` also keeps the tray menu toggle in sync (Rust-side);
 * `notify` already enforces the device on/off gate, so `emit` only adds the
 * per-event pref check on top.
 */
export default defineNuxtPlugin({
	name: "native-notifications",
	setup() {
		if (!isTauri()) return;
		setNativeNotifications({
			getEnabled: () => invoke<boolean>("notifications_enabled"),
			setEnabled: (enabled) =>
				invoke("set_notifications_enabled", { enabled }).then(() => undefined),
			emit: async (event, message) => {
				// Honor the per-event pref: fire only if this event is in the enabled
				// (native) list. No stored prefs yet → treat all local events as on,
				// matching the settings page's defaults.
				const prefs = await invoke<WorkspaceNotificationSettings | null>(
					"notification_prefs",
				);
				const enabledEvents = prefs?.notificationEventsApp;
				if (enabledEvents && !enabledEvents.includes(event as never)) return;
				await invoke("notify", { title: message.title, body: message.body });
			},
		});
	},
});
