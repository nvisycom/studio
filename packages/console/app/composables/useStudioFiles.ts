import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import { useLocalStorage } from "@vueuse/core";

export interface OpenFile {
	fileId: string;
	displayName: string;
	/**
	 * The file's real extension from the API (e.g. `csv`), the source of truth for
	 * the preview renderer. Prefer this over parsing {@link displayName}, whose
	 * suffix lies for derived files (a redacted `report.csv` is `report.csv.redacted`).
	 * Empty until the file's metadata loads.
	 */
	fileExtension: string;
	contentUrl: string | null;
	isLoading: boolean;
}

/**
 * Composable for managing open files in Studio across navigation.
 * Uses a shared state that persists while the app is running.
 */
const openFiles = ref<Map<string, OpenFile>>(new Map());
const activeFileId = ref<string | null>(null);

/** localStorage key for the persisted per-workspace Studio open-files session. */
export const STUDIO_OPEN_FILES_KEY = "studio-open-files";

// Persisted, per-workspace session so open tabs survive a refresh. Only the
// file identities + order + active tab are stored — the blob content URLs are
// session-bound and re-downloaded on restore.
interface PersistedSession {
	ids: string[];
	active: string | null;
}
const persistedSessions = useLocalStorage<Record<string, PersistedSession>>(
	STUDIO_OPEN_FILES_KEY,
	{},
);

// Which workspace the in-memory tabs currently belong to. When the active
// workspace changes, the tabs are swapped to that workspace's session (see the
// slug watcher below), so the studio never shows another workspace's files.
const loadedSlug = ref<string | null>(null);

// The workspace-swap watcher is registered once, not per composable call.
let swapWatcherRegistered = false;

export function useStudioFiles() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	// Snapshot the current in-memory tabs into localStorage. Keyed off the
	// workspace the tabs actually belong to (loadedSlug), not the reactive
	// current slug, so a mid-switch persist can't write one workspace's tabs
	// under another's key.
	function persist() {
		const slug = loadedSlug.value ?? currentWorkspaceSlug.value;
		if (!slug) return;
		persistedSessions.value = {
			...persistedSessions.value,
			[slug]: {
				ids: Array.from(openFiles.value.keys()),
				active: activeFileId.value,
			},
		};
	}

	// Get active file
	const activeFile = computed(() => {
		if (!activeFileId.value) return null;
		return openFiles.value.get(activeFileId.value) || null;
	});

	// Get all open files as array
	const openFilesList = computed(() => Array.from(openFiles.value.values()));

	// Register a tab in loading state (synchronous, so tabs appear immediately).
	function addLoadingTab(fileId: string, file?: NvisyFile) {
		openFiles.value.set(fileId, {
			fileId,
			displayName: file?.displayName || "Loading...",
			fileExtension: file?.fileExtension ?? "",
			contentUrl: null,
			isLoading: true,
		});
	}

	// Download a tab's metadata + content and fill it in. Assumes the tab is
	// already registered (addLoadingTab). Safe to run many in parallel. Fetches
	// against the workspace the tabs currently belong to (loadedSlug) and drops
	// the result if the workspace switched away mid-download.
	async function fetchIntoTab(fileId: string, file?: NvisyFile) {
		const workspaceSlug = loadedSlug.value ?? currentWorkspaceSlug.value;
		try {
			const client = $nvisyClient.value;
			if (!client || !workspaceSlug || !authToken.value?.apiToken) {
				throw new Error("Not authenticated");
			}

			const fileData =
				file ?? (await client.files.getFile(workspaceSlug, fileId));
			const contentUrl = await fetchFileContentUrl(
				client,
				workspaceSlug,
				fileId,
			);

			// Ignore if the workspace switched away, or the tab was closed, while
			// this download was in flight.
			if (loadedSlug.value !== workspaceSlug || !openFiles.value.has(fileId)) {
				if (contentUrl) URL.revokeObjectURL(contentUrl);
				return;
			}
			openFiles.value.set(fileId, {
				fileId,
				displayName: fileData.displayName,
				fileExtension: fileData.fileExtension,
				contentUrl,
				isLoading: false,
			});
			persist();
		} catch (error) {
			console.error("Failed to load file:", error);
			const existing = openFiles.value.get(fileId);
			if (existing && loadedSlug.value === workspaceSlug) {
				openFiles.value.set(fileId, { ...existing, isLoading: false });
			}
		}
	}

	// Open a file (add to open files and set as active)
	async function openFile(fileId: string, file?: NvisyFile) {
		// Claim ownership only when no workspace owns the tabs yet (the very first
		// open). Never re-attribute existing tabs here: if this runs after the
		// active workspace changed but before the swap watcher fires, overwriting
		// loadedSlug would relabel the previous workspace's tabs and make the
		// watcher skip the swap. Transitions are the watcher's job.
		if (!loadedSlug.value && currentWorkspaceSlug.value)
			loadedSlug.value = currentWorkspaceSlug.value;

		// If already open, just set as active
		if (openFiles.value.has(fileId)) {
			activeFileId.value = fileId;
			persist();
			return;
		}

		addLoadingTab(fileId, file);
		activeFileId.value = fileId;
		persist();

		await fetchIntoTab(fileId, file);
	}

	// Close a file
	function closeFile(fileId: string) {
		const file = openFiles.value.get(fileId);
		if (file?.contentUrl) {
			URL.revokeObjectURL(file.contentUrl);
		}
		openFiles.value.delete(fileId);

		// If closing active file, switch to another open file or null
		if (activeFileId.value === fileId) {
			const remaining = Array.from(openFiles.value.keys());
			activeFileId.value = remaining.length > 0 ? (remaining[0] ?? null) : null;
		}
		persist();
	}

	// Close every open file except the given one (it becomes active).
	function closeOtherFiles(keepId: string) {
		if (!openFiles.value.has(keepId)) return;
		for (const [id, file] of openFiles.value) {
			if (id === keepId) continue;
			if (file.contentUrl) URL.revokeObjectURL(file.contentUrl);
			openFiles.value.delete(id);
		}
		activeFileId.value = keepId;
		persist();
	}

	// Close every file to the right of the given one (order = insertion order).
	function closeFilesToRight(fileId: string) {
		const ids = Array.from(openFiles.value.keys());
		const index = ids.indexOf(fileId);
		if (index === -1) return;
		for (const id of ids.slice(index + 1)) {
			const file = openFiles.value.get(id);
			if (file?.contentUrl) URL.revokeObjectURL(file.contentUrl);
			openFiles.value.delete(id);
		}
		// The active tab may have been to the right — fall back to the kept file.
		if (activeFileId.value && !openFiles.value.has(activeFileId.value)) {
			activeFileId.value = fileId;
		}
		persist();
	}

	// Move a tab to sit before `toId` (drag-to-reorder), or to the end when `toId`
	// is undefined (dropped past the last tab). Rebuilds the Map in the new order,
	// since a Map preserves insertion order and tabs render off it.
	function reorderFiles(fromId: string, toId?: string) {
		if (fromId === toId) return;
		const ids = Array.from(openFiles.value.keys());
		const from = ids.indexOf(fromId);
		if (from === -1) return;
		ids.splice(from, 1);
		const to = toId ? ids.indexOf(toId) : -1;
		if (toId && to === -1) return; // target no longer open — leave as-is
		ids.splice(to === -1 ? ids.length : to, 0, fromId);
		const reordered = new Map(
			ids.map((id) => [id, openFiles.value.get(id)!] as const),
		);
		openFiles.value = reordered;
		persist();
	}

	// Set active file
	function setActiveFile(fileId: string) {
		if (openFiles.value.has(fileId)) {
			activeFileId.value = fileId;
			persist();
		}
	}

	// Check if a file is open
	function isFileOpen(fileId: string) {
		return openFiles.value.has(fileId);
	}

	// Close all files
	function closeAllFiles() {
		for (const file of openFiles.value.values()) {
			if (file.contentUrl) {
				URL.revokeObjectURL(file.contentUrl);
			}
		}
		openFiles.value.clear();
		activeFileId.value = null;
		persist();
	}

	// Drop all in-memory tabs (revoking blob URLs) without touching what's
	// persisted — used when swapping to another workspace's session.
	function clearInMemory() {
		for (const file of openFiles.value.values()) {
			if (file.contentUrl) URL.revokeObjectURL(file.contentUrl);
		}
		openFiles.value.clear();
		activeFileId.value = null;
	}

	// Load a workspace's persisted tabs into memory. Marks the in-memory tabs as
	// belonging to `slug` first, so persist() writes back under the right key.
	// All tabs are registered synchronously (so they appear at once, not one by
	// one), then their content downloads in parallel.
	async function loadSession(slug: string) {
		loadedSlug.value = slug;
		const session = persistedSessions.value[slug];
		if (!session || session.ids.length === 0) return;

		// Show every tab immediately, active one first.
		for (const fileId of session.ids) {
			addLoadingTab(fileId);
		}
		activeFileId.value =
			session.active && session.ids.includes(session.active)
				? session.active
				: (session.ids[0] ?? null);
		persist();

		// Download all content concurrently.
		await Promise.all(session.ids.map((fileId) => fetchIntoTab(fileId)));
	}

	// Re-open the persisted tabs for the current workspace (e.g. after a
	// refresh). No-op if the current workspace's tabs are already loaded.
	async function restoreSession() {
		const slug = currentWorkspaceSlug.value;
		if (!slug || loadedSlug.value === slug) return;
		clearInMemory();
		await loadSession(slug);
	}

	// Swap tabs whenever the active workspace changes, so the studio always
	// shows the current workspace's files and never another's. Registered once
	// in a detached effect scope so the watcher lives for the app's lifetime,
	// independent of which component happened to trigger registration.
	if (!swapWatcherRegistered) {
		swapWatcherRegistered = true;
		effectScope(true).run(() => {
			watch(currentWorkspaceSlug, (slug) => {
				if (!slug || loadedSlug.value === slug) return;
				// The outgoing workspace's tabs were already persisted
				// per-mutation under loadedSlug; just clear and load the new one.
				clearInMemory();
				void loadSession(slug);
			});
		});
	}

	return {
		// State
		openFiles: openFilesList,
		activeFileId: readonly(activeFileId),
		activeFile,

		// Actions
		openFile,
		closeFile,
		closeOtherFiles,
		closeFilesToRight,
		closeAllFiles,
		reorderFiles,
		setActiveFile,
		isFileOpen,
		restoreSession,
	};
}
