import { isTauri } from "@tauri-apps/api/core";

/**
 * Disable text selection in the desktop app — dragging over labels, nav, and
 * buttons and highlighting text reads as a web page, not a native app.
 *
 * We block the `selectstart` event rather than set `user-select: none` in CSS:
 * on WKWebView, `user-select: none` on (or above) a `:hover`-reveal element makes
 * its hover state stick after the pointer leaves (the audit rows' hover controls
 * got stuck) — a bug that appears only in the Tauri webview, not Safari. A
 * `selectstart` preventer has no such side effect.
 *
 * Selection is still allowed inside form fields, editable regions, and anything
 * that opts in with `.select-text`, where selecting text is genuinely useful.
 */
function isSelectable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	return (
		target.closest(
			"input, textarea, [contenteditable]:not([contenteditable='false']), .select-text",
		) !== null
	);
}

export default defineNuxtPlugin({
	name: "no-select",
	setup() {
		if (!isTauri()) return;

		document.addEventListener("selectstart", (event) => {
			if (!isSelectable(event.target)) event.preventDefault();
		});
	},
});
