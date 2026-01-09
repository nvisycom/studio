import type { File as NvisyFile } from "@nvisy/sdk/datatypes";

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

export function useStudioFiles() {
  const { $nvisyClient } = useNuxtApp();
  const { authToken } = useAuth();

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

    // Fetch file content
    try {
      const client = $nvisyClient.value;
      if (!client || !authToken.value?.apiToken) {
        throw new Error("Not authenticated");
      }

      // Fetch file metadata if not provided
      let fileData = file;
      if (!fileData) {
        fileData = await client.files.getFile(fileId);
      }

      // Download file content
      const response = await client.files.downloadFile(fileId);
      const blob = await response.blob();
      const contentUrl = URL.createObjectURL(blob);

      // Update the open file entry
      openFiles.value.set(fileId, {
        fileId,
        displayName: fileData.displayName,
        contentUrl,
        isLoading: false,
      });
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
      activeFileId.value = remaining.length > 0 ? remaining[0] : null;
    }
  }

  // Set active file
  function setActiveFile(fileId: string) {
    if (openFiles.value.has(fileId)) {
      activeFileId.value = fileId;
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
  };
}
