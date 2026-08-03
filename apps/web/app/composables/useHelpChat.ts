// Shared open state for the single HelpChat popup, so any trigger in the shell
// controls the one mounted instance instead of each parent poking a child ref.
const isOpen = ref(false);

export function useHelpChat() {
	function open() {
		isOpen.value = true;
	}

	function close() {
		isOpen.value = false;
	}

	function toggle() {
		isOpen.value = !isOpen.value;
	}

	return { isOpen, open, close, toggle };
}
