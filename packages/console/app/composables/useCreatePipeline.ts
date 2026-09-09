// Shared open state for the single "create pipeline" dialog, mounted once in the
// shell (CreatePipelineDialog). Any trigger — the command palette, the workflows
// page button — calls open() and the one dialog opens, wherever the user is.
// Mirrors useCreatePolicy / useCreateWorkspace.
const isOpen = ref(false);

export function useCreatePipeline() {
	function open() {
		isOpen.value = true;
	}
	function close() {
		isOpen.value = false;
	}
	return { isOpen, open, close };
}
