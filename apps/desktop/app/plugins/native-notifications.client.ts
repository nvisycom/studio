import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Fill the native-notification seam with the Tauri store commands, so the shared
 * Notifications settings page can read/toggle the desktop preference without
 * importing Tauri. `set_notifications_enabled` also keeps the tray menu toggle
 * in sync (Rust-side).
 */
export default defineNuxtPlugin({
	name: "native-notifications",
	setup() {
		if (!isTauri()) return;
		setNativeNotifications({
			getEnabled: () => invoke<boolean>("notifications_enabled"),
			setEnabled: (enabled) =>
				invoke("set_notifications_enabled", { enabled }).then(() => undefined),
		});
	},
});
