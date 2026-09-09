/**
 * Open state for the global chat rail, so any trigger in the shell (the header
 * toggle, a keyboard shortcut) controls the single mounted `AppChat` instead of
 * each caller poking a child ref. Independent of the left sidebar's state.
 *
 * A module-level singleton: one chat rail, one source of truth. The rail width
 * animates from this via a CSS var on the shell (see `AppChat`).
 */
const isOpen = ref(false);

/** Cmd/Ctrl+J toggles the chat rail (Cmd/Ctrl+B is the left sidebar). */
const CHAT_SHORTCUT = "j";
let shortcutBound = false;

export function useChatPanel() {
	function open() {
		isOpen.value = true;
	}

	function close() {
		isOpen.value = false;
	}

	function toggle() {
		isOpen.value = !isOpen.value;
	}

	// Bind the toggle shortcut once, on the client, for the app's lifetime.
	if (import.meta.client && !shortcutBound) {
		shortcutBound = true;
		window.addEventListener("keydown", (event) => {
			if (
				event.key.toLowerCase() === CHAT_SHORTCUT &&
				(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault();
				toggle();
			}
		});
	}

	return { isOpen: readonly(isOpen), open, close, toggle };
}
