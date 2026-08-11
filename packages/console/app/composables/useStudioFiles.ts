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
// session-bound and re-downloaded on restore. Tracks which workspaces have
// already been restored so we only re-open once per session.
interface PersistedSession {
	ids: string[];
	active: string | null;
}
const persistedSessions = useLocalStorage<Record<string, PersistedSession>>(
	STUDIO_OPEN_FILES_KEY,
	{},
);
const restoredSlugs = new Set<string>();

export function useStudioFiles() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	// Snapshot the current in-memory tabs into localStorage for this workspace.
	function persist() {
		const slug = currentWorkspaceSlug.value;
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

	// Open a file (add to open files and set as active)
	async function openFile(fileId: string, file?: NvisyFile) {
		// If already open, just set as active
		if (openFiles.value.has(fileId)) {
			activeFileId.value = fileId;
			persist();
			return;
		}

		// Add to open files with loading state
		openFiles.value.set(fileId, {
			fileId,
			displayName: file?.displayName || "Loading...",
			contentUrl: null,
			isLoading: true,
		});
		activeFileId.value = fileId;
		persist();

		// Fetch file content
		try {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug || !authToken.value?.apiToken) {
				throw new Error("Not authenticated");
			}

			// Fetch file metadata if not provided
			let fileData = file;
			if (!fileData) {
				fileData = await client.files.getFile(workspaceSlug, fileId);
			}

			// Download file content
			const contentUrl = await fetchFileContentUrl(
				client,
				workspaceSlug,
				fileId,
			);

			// Update the open file entry
			openFiles.value.set(fileId, {
				fileId,
				displayName: fileData.displayName,
				contentUrl,
				isLoading: false,
			});
			persist();
		} catch (error) {
			console.error("Failed to load file:", error);
			// Update with error state
			const existing = openFiles.value.get(fileId);
			if (existing) {
				openFiles.value.set(fileId, {
					...existing,
					isLoading: false,
				});
			}
		}
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

	// Re-open the persisted tabs for the current workspace after a refresh.
	// Runs at most once per workspace per session; skips if tabs are already
	// open in memory. Content is re-downloaded (fresh blob URLs) by openFile.
	async function restoreSession() {
		const slug = currentWorkspaceSlug.value;
		if (!slug || restoredSlugs.has(slug)) return;
		restoredSlugs.add(slug);

		// Already have tabs in memory (e.g. navigated here in-app) — nothing to do.
		if (openFiles.value.size > 0) return;

		const session = persistedSessions.value[slug];
		if (!session || session.ids.length === 0) return;

		// Re-open in stored order, then restore the active tab.
		for (const fileId of session.ids) {
			await openFile(fileId);
		}
		if (session.active && openFiles.value.has(session.active)) {
			activeFileId.value = session.active;
			persist();
		}
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
