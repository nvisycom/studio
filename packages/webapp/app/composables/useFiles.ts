import { useQuery, useMutation } from "@pinia/colada";
import type {
	File as NvisyFile,
	UpdateFile,
	ListFilesQuery,
} from "@nvisy/sdk/datatypes";

export interface UseFilesOptions {
	workspaceId?: MaybeRef<string | null>;
	query?: MaybeRef<ListFilesQuery>;
	pageSize?: number;
}

/**
 * Composable for file operations with infinite scroll support
 */
export function useFiles(options: UseFilesOptions = {}) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceId } = useWorkspaces();

	const effectiveWorkspaceId = computed(
		() =>
			(options.workspaceId
				? toValue(options.workspaceId)
				: currentWorkspaceId.value) || "",
	);

	const pageSize = options.pageSize ?? 50;

	// Track all loaded files and current offset
	const allFiles = ref<NvisyFile[]>([]);
	const currentOffset = ref(0);
	const hasMore = ref(true);
	const isLoadingMore = ref(false);

	const queryParams = computed<ListFilesQuery>(() => ({
		...toValue(options.query ?? {}),
	}));

	const filesQuery = useQuery({
		key: () => [
			"files",
			effectiveWorkspaceId.value,
			JSON.stringify(queryParams.value),
		],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.files.listFiles(effectiveWorkspaceId.value, {
				...queryParams.value,
				offset: 0,
				limit: pageSize,
			});
			// Reset state on initial load
			allFiles.value = result;
			currentOffset.value = result.length;
			hasMore.value = result.length >= pageSize;
			return result;
		},
		enabled: () => !!effectiveWorkspaceId.value && !!authToken.value?.apiToken,
		staleTime: 0,
	});

	// Sync allFiles when query data changes (e.g., from cache on navigation)
	watch(
		() => filesQuery.data.value,
		(data) => {
			if (data && allFiles.value.length === 0) {
				allFiles.value = data;
				currentOffset.value = data.length;
				hasMore.value = data.length >= pageSize;
			}
		},
		{ immediate: true },
	);

	// Load more files for infinite scroll
	async function loadMore() {
		if (!hasMore.value || isLoadingMore.value) return;

		const client = $nvisyClient.value;
		if (!client) return;

		isLoadingMore.value = true;
		try {
			const result = await client.files.listFiles(effectiveWorkspaceId.value, {
				...queryParams.value,
				offset: currentOffset.value,
				limit: pageSize,
			});

			if (result.length > 0) {
				allFiles.value = [...allFiles.value, ...result];
				currentOffset.value += result.length;
			}

			hasMore.value = result.length >= pageSize;
		} finally {
			isLoadingMore.value = false;
		}
	}

	// Reset and reload files
	function reset() {
		allFiles.value = [];
		currentOffset.value = 0;
		hasMore.value = true;
		filesQuery.refresh();
	}

	const updateFileMutation = useMutation({
		mutation: async ({
			fileId,
			updates,
		}: {
			fileId: string;
			updates: UpdateFile;
		}) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.files.updateFile(fileId, updates);
		},
		onSuccess() {
			reset();
		},
	});

	const deleteFileMutation = useMutation({
		mutation: async (fileId: string) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			await client.files.deleteFile(fileId);
		},
		onSuccess() {
			reset();
		},
	});

	const uploadFilesMutation = useMutation({
		mutation: async (files: File[]) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const wId = effectiveWorkspaceId.value;
			if (!wId) throw new Error("No workspace selected");
			return await client.files.uploadFiles(wId, files);
		},
		onSuccess() {
			reset();
		},
	});

	async function downloadFile(fileId: string, fileName: string) {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		const response = await client.files.downloadFile(fileId);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function downloadMultiple(fileIds: string[], format: "zip" | "tar") {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		const wId = effectiveWorkspaceId.value;
		if (!wId) throw new Error("No workspace selected");
		const response = await client.files.downloadFilesArchive(wId, {
			fileIds,
			format,
		});
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `files.${format}`;
		a.click();
		URL.revokeObjectURL(url);
	}

	return {
		// Query state
		files: allFiles,
		isLoading: filesQuery.isLoading,
		error: filesQuery.error,
		refresh: reset,

		// Infinite scroll
		loadMore,
		hasMore,
		isLoadingMore,

		// Mutations
		updateFile: updateFileMutation.mutate,
		updateFileAsync: updateFileMutation.mutateAsync,
		isUpdating: updateFileMutation.isLoading,
		updateError: updateFileMutation.error,

		deleteFile: deleteFileMutation.mutate,
		deleteFileAsync: deleteFileMutation.mutateAsync,
		isDeleting: deleteFileMutation.isLoading,
		deleteError: deleteFileMutation.error,

		uploadFiles: uploadFilesMutation.mutate,
		uploadFilesAsync: uploadFilesMutation.mutateAsync,
		isUploading: uploadFilesMutation.isLoading,
		uploadError: uploadFilesMutation.error,

		// Actions
		downloadFile,
		downloadMultiple,
	};
}
