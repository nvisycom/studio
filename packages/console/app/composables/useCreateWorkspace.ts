// Shared open state for the single "create workspace" sheet, so any trigger in
// the shell (the workspace switcher, the account menu, the command menu) drives
// one sheet hosted once in the layout — rather than each surface owning its own
// copy of the sheet and its own open ref. Mirrors useHelpChat / useChatPanel.
const isOpen = ref(false);

export function useCreateWorkspace() {
	function open() {
		isOpen.value = true;
	}
	function close() {
		isOpen.value = false;
	}
	return { isOpen, open, close };
}
