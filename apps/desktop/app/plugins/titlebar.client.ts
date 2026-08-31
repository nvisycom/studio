import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * Mark the document as running inside the Tauri desktop shell's main window.
 *
 * The main window uses the macOS "Overlay" title-bar style, so the webview
 * extends full-height behind the traffic-light buttons. The shared layer keys
 * its title-bar inset (top padding + a drag region) off this `tauri` root class,
 * so the web app — which has no native title bar — gets none of it.
 *
 * Gated on the "main" window: the spotlight launcher is a separate window that
 * renders the same app, and must not inherit the main window's title-bar chrome.
 */
export default defineNuxtPlugin({
	name: "titlebar",
	enforce: "pre",
	setup() {
		if (!isTauri() || getCurrentWindow().label !== "main") return;
		document.documentElement.classList.add("tauri");
	},
});
