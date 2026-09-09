import { isTauri } from "@tauri-apps/api/core";

/**
 * Suppress the WKWebView native right-click menu (Back / Reload / Inspect
 * Element) in the desktop app, so it doesn't leak the webview underneath the
 * native shell.
 *
 * We listen in the BUBBLE phase, so the app's own right-click menus (reka's
 * ContextMenuTrigger, the data tables) run first and call `preventDefault`
 * themselves — those events reach us already handled and we leave them alone.
 * An unhandled event means nothing in the app claimed the right-click, so the
 * native menu would appear: we cancel it — except over editable fields, where
 * the native Copy / Paste menu is genuinely useful.
 *
 * Desktop-only: on the web the browser's context menu is expected, so this
 * plugin doesn't run there.
 */
function isEditable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const el = target.closest(
		"input, textarea, [contenteditable]:not([contenteditable='false'])",
	);
	return el !== null;
}

export default defineNuxtPlugin({
	name: "context-menu",
	setup() {
		if (!isTauri()) return;

		document.addEventListener("contextmenu", (event) => {
			// Already handled by an in-app menu, or over an editable field where the
			// native Copy/Paste menu is wanted — let it be.
			if (event.defaultPrevented || isEditable(event.target)) return;
			event.preventDefault();
		});
	},
});
