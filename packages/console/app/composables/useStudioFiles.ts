import type { File as NvisyFile } from "@nvisy/sdk/datatypes";
import { useLocalStorage } from "@vueuse/core";

export interface OpenFile {
	fileId: string;
	displayName: string;
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
		// Tabs belong to the current workspace (covers the first open before any
		// workspace switch has run).
		if (currentWorkspaceSlug.value)
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

	// Set active file
	function setActiveFile(fileId: string) {
		if (openFiles.value.has(fileId)) {
			activeFileId.value = fileId;
			persist();
		}
	}

	// Move a file to the front of the list
	function moveFileToFront(fileId: string) {
		if (!openFiles.value.has(fileId)) return;

		const file = openFiles.value.get(fileId)!;
		const newMap = new Map<string, OpenFile>();
		newMap.set(fileId, file);

		for (const [id, f] of openFiles.value) {
			if (id !== fileId) {
				newMap.set(id, f);
			}
		}

		openFiles.value = newMap;
		activeFileId.value = fileId;
		persist();
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
		setActiveFile,
		moveFileToFront,
		isFileOpen,
		closeAllFiles,
		restoreSession,
	};
}
