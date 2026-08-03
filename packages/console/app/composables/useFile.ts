import type { File as NvisyFile } from "@nvisy/sdk/datatypes";

export interface UseFileOptions {
	fileId: MaybeRef<string | null>;
}

/**
 * Composable for fetching a single file's metadata and content
 */
export function useFile(options: UseFileOptions) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const effectiveFileId = computed(() => toValue(options.fileId) || "");

	// Get file metadata
	const fileQuery = useQuery({
		key: () => ["file", currentWorkspaceSlug.value, effectiveFileId.value],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.files.getFile(workspaceSlug, effectiveFileId.value);
		},
		enabled: () =>
			!!effectiveFileId.value &&
			!!currentWorkspaceSlug.value &&
			!!authToken.value?.apiToken,
	});

	// Download file content as blob URL for preview
	const fileContentQuery = useQuery({
		key: () => [
			"file-content",
			currentWorkspaceSlug.value,
			effectiveFileId.value,
		],
		query: async () => {
			const client = $nvisyClient.value;
			const workspaceSlug = currentWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			const response = await client.files.downloadFile(
				workspaceSlug,
				effectiveFileId.value,
			);
			const blob = await response.blob();
			return URL.createObjectURL(blob);
		},
		enabled: () =>
			!!effectiveFileId.value &&
			!!currentWorkspaceSlug.value &&
			!!authToken.value?.apiToken,
	});

	// Revoke the previous blob URL whenever the content changes (e.g. the
	// reactive fileId switches), not just on unmount — otherwise each switch
	// leaks the prior URL.
	watch(
		() => fileContentQuery.data.value,
		(_current, previous) => {
			if (previous) URL.revokeObjectURL(previous);
		},
	);

	// Clean up the current blob URL when the component unmounts.
	onUnmounted(() => {
		if (fileContentQuery.data.value) {
			URL.revokeObjectURL(fileContentQuery.data.value);
		}
	});

	return {
		// File metadata
		file: fileQuery.data,
		isLoading: fileQuery.isLoading,
		error: fileQuery.error,
		refresh: fileQuery.refetch,

		// File content (blob URL for preview)
		contentUrl: fileContentQuery.data,
		isLoadingContent: fileContentQuery.isLoading,
		contentError: fileContentQuery.error,
	};
}
