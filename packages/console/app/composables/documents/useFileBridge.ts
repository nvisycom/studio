/**
 * The seam between the shared UI and the host's native file I/O.
 *
 * In the browser these providers stay `undefined` and every consumer falls back
 * to its DOM-based path: a hidden `<input type=file>` for opening, an anchor
 * `download` for saving. The desktop app injects Tauri-backed implementations
 * (native Finder open/save panels writing real filesystem paths) from a
 * desktop-only plugin via `setFileBridge`.
 *
 * Like {@link useApiFetch}, this composable stays free of any Tauri dependency:
 * the layer only exposes the seam, and the desktop fills it in. Consumers must
 * always keep a working browser fallback for when a provider is unset.
 */
import type { Ref } from "vue";

/**
 * Open a native file picker and return the chosen files (or `null` if the user
 * cancelled). `accept` is a comma-separated extension list (e.g. `.csv,.docx`),
 * matching an `<input accept>` value, so the same allowlist drives both hosts.
 */
export type OpenFilesFn = (accept: string) => Promise<File[] | null>;

/**
 * Save `data` to disk under a suggested name via a native save panel. Resolves
 * `true` once written, `false` if the user cancelled.
 */
export type SaveFileFn = (
	data: Blob,
	suggestedName: string,
) => Promise<boolean>;

/** A handler for files dropped onto the window from the OS. */
export type DropHandler = (files: File[]) => void;

/** A handler for the OS drag hovering the window (true) or leaving it (false). */
export type DragStateHandler = (over: boolean) => void;

/** Native file-I/O providers, or `undefined` to use the browser fallback. */
export interface FileBridge {
	openFiles?: OpenFilesFn;
	saveFile?: SaveFileFn;
}

// Module-level so an injected bridge is shared across every consumer.
const bridge = ref<FileBridge>({});

// Handlers for host-delivered OS drops and drag-over state. Sets so a page can
// subscribe/unsubscribe across its lifecycle without clobbering another.
const dropHandlers = new Set<DropHandler>();
const dragStateHandlers = new Set<DragStateHandler>();

// The effective per-file upload cap for the current workspace (or `undefined`
// for no cap). Kept here so the desktop host can skip an oversized OS drop by
// its size *before* reading its bytes over IPC. The page that knows the
// workspace publishes it via `setDropSizeLimit`.
const dropSizeLimit = ref<number | undefined>(undefined);

/** Inject native file-I/O providers (desktop only). */
export function setFileBridge(next: FileBridge) {
	bridge.value = next;
}

/** Publish the current workspace's effective upload cap for host drops. */
export function setDropSizeLimit(maxBytes: number | undefined) {
	dropSizeLimit.value = maxBytes;
}

/** The current drop size cap, read by the desktop host at drop time. */
export function getDropSizeLimit(): number | undefined {
	return dropSizeLimit.value;
}

/** Dispatch a host-delivered OS drop to every registered handler (desktop). */
export function emitFilesDropped(files: File[]) {
	for (const handler of dropHandlers) handler(files);
}

/** Dispatch a host-delivered OS drag enter/leave to every handler (desktop). */
export function emitDragStateChanged(over: boolean) {
	for (const handler of dragStateHandlers) handler(over);
}

export function useFileBridge(): {
	/** The native providers, empty on the web. */
	bridge: Readonly<Ref<FileBridge>>;
	/**
	 * Register a handler for host-delivered OS drops, auto-unregistered on
	 * unmount. Only the desktop emits these (Tauri intercepts drops before the
	 * DOM); on the web it never fires and pages use the DOM `drop` event.
	 */
	onFilesDropped: (handler: DropHandler) => void;
	/**
	 * Register a handler for the OS drag hovering/leaving the window, so a page
	 * can show its drop affordance on desktop (where DOM drag events don't fire).
	 * Auto-unregistered on unmount; never fires on the web.
	 */
	onDragStateChanged: (handler: DragStateHandler) => void;
} {
	function onFilesDropped(handler: DropHandler) {
		dropHandlers.add(handler);
		onScopeDispose(() => dropHandlers.delete(handler));
	}

	function onDragStateChanged(handler: DragStateHandler) {
		dragStateHandlers.add(handler);
		onScopeDispose(() => dragStateHandlers.delete(handler));
	}

	return { bridge, onFilesDropped, onDragStateChanged };
}
