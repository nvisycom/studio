import { listen, type UnlistenFn } from "@tauri-apps/api/event";

interface TauriDropEvent {
	paths: string[];
	position: { x: number; y: number };
}

const isDragging = ref(false);
const droppedPaths = ref<string[]>([]);

let unlistenDrop: UnlistenFn | null = null;
let unlistenHover: UnlistenFn | null = null;
let unlistenCancel: UnlistenFn | null = null;

export function useDragDrop() {
	const setupListeners = async () => {
		// Listen for file drop hover (dragging over window)
		unlistenHover = await listen<TauriDropEvent>("tauri://drag-over", () => {
			isDragging.value = true;
		});

		// Listen for file drop
		unlistenDrop = await listen<TauriDropEvent>(
			"tauri://drag-drop",
			(event) => {
				isDragging.value = false;
				if (event.payload.paths && event.payload.paths.length > 0) {
					droppedPaths.value = event.payload.paths;
				}
			},
		);

		// Listen for drag cancel (leaving window)
		unlistenCancel = await listen("tauri://drag-leave", () => {
			isDragging.value = false;
		});
	};

	const cleanupListeners = () => {
		unlistenDrop?.();
		unlistenHover?.();
		unlistenCancel?.();
	};

	const clearDroppedPaths = () => {
		droppedPaths.value = [];
	};

	return {
		isDragging: readonly(isDragging),
		droppedPaths: readonly(droppedPaths),
		setupListeners,
		cleanupListeners,
		clearDroppedPaths,
	};
}
