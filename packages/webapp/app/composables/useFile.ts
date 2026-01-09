import { useQuery } from "@pinia/colada";
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

	const effectiveFileId = computed(() => toValue(options.fileId) || "");

	// Get file metadata
	const fileQuery = useQuery({
		key: () => ["file", effectiveFileId.value],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.files.getFile(effectiveFileId.value);
		},
		enabled: () => !!effectiveFileId.value && !!authToken.value?.apiToken,
	});

	// Download file content as blob URL for preview
	const fileContentQuery = useQuery({
		key: () => ["file-content", effectiveFileId.value],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const response = await client.files.downloadFile(effectiveFileId.value);
			const blob = await response.blob();
			return URL.createObjectURL(blob);
		},
		enabled: () => !!effectiveFileId.value && !!authToken.value?.apiToken,
	});

	// Clean up blob URL when component unmounts
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
