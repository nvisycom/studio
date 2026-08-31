import { isTauri } from "@tauri-apps/api/core";

/**
 * Mark the app as running in the desktop shell, so shared pages can render
 * desktop-specific UI via `usePlatform`. Runs before pages render.
 */
export default defineNuxtPlugin({
	name: "platform",
	enforce: "pre",
	setup() {
		if (isTauri()) setDesktopPlatform();
	},
});
