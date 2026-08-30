import { isTauri } from "@tauri-apps/api/core";

/**
 * Mark the document as running inside the Tauri desktop shell.
 *
 * The main window uses the macOS "Overlay" title-bar style, so the webview
 * extends full-height behind the traffic-light buttons. The shared layer keys
 * its title-bar inset (top padding + a drag region) off this `tauri` root class,
 * so the web app — which has no native title bar — gets none of it.
 */
export default defineNuxtPlugin({
	name: "titlebar",
	enforce: "pre",
	setup() {
		if (!isTauri()) return;
		document.documentElement.classList.add("tauri");
	},
});
