// Shared open state for the single "create policy" dialog, mounted once in the
// shell (CreatePolicyDialog). Any trigger — the command palette, the overview
// setup step, the policies-page button — calls open() and the one dialog opens,
// wherever the user is. Mirrors useCreateWorkspace / useHelpChat.
const isOpen = ref(false);

export function useCreatePolicy() {
	function open() {
		isOpen.value = true;
	}
	function close() {
		isOpen.value = false;
	}
	return { isOpen, open, close };
}
