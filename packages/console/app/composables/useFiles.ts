import type {
	File as NvisyFile,
	UpdateFile,
	ListFiles,
} from "@nvisy/sdk/datatypes";

export interface UseFilesOptions {
	workspaceSlug?: MaybeRef<string | null>;
	query?: MaybeRef<ListFiles>;
	pageSize?: number;
}

/**
 * Composable for file operations with infinite scroll support
 */
export function useFiles(options: UseFilesOptions = {}) {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();
	const { currentWorkspaceSlug } = useWorkspaces();

	const effectiveWorkspaceSlug = computed(
		() =>
			(options.workspaceSlug
				? toValue(options.workspaceSlug)
				: currentWorkspaceSlug.value) || "",
	);

	const pageSize = options.pageSize ?? 50;

	// Track all loaded files and cursor for pagination
	const allFiles = ref<NvisyFile[]>([]);
	const nextCursor = ref<string | undefined>(undefined);
	const hasMore = ref(true);
	const isLoadingMore = ref(false);

	const queryParams = computed<ListFiles>(() => ({
		...toValue(options.query ?? {}),
	}));

	const filesQuery = useQuery({
		key: () => [
			"files",
			effectiveWorkspaceSlug.value,
			JSON.stringify(queryParams.value),
		],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const result = await client.files.listFiles(
				effectiveWorkspaceSlug.value,
				{
					...queryParams.value,
					limit: pageSize,
				},
			);
			// The watcher below is the single source that syncs allFiles from
			// query data; here we only track pagination cursors.
			nextCursor.value = result.nextCursor ?? undefined;
			hasMore.value = !!result.nextCursor;
			return result.items;
		},
		enabled: () =>
			!!effectiveWorkspaceSlug.value && !!authToken.value?.apiToken,
	});

	// Reset pagination state and force refetch when workspace changes
	watch(effectiveWorkspaceSlug, (newId, oldId) => {
		if (newId !== oldId) {
			allFiles.value = [];
			nextCursor.value = undefined;
			hasMore.value = true;
			filesQuery.refetch();
		}
	});

	// Sync allFiles with query data
	// This handles initial load, navigation back to page, and refresh after mutations
	watch(
		() => filesQuery.data.value,
		(data) => {
			// Don't sync during loadMore operations (we handle that manually)
			if (!isLoadingMore.value && data) {
				allFiles.value = data;
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
			const result = await client.files.listFiles(
				effectiveWorkspaceSlug.value,
				{
					...queryParams.value,
					after: nextCursor.value,
					limit: pageSize,
				},
			);

			if (result.items.length > 0) {
				allFiles.value = [...allFiles.value, ...result.items];
			}

			nextCursor.value = result.nextCursor ?? undefined;
			hasMore.value = !!result.nextCursor;
		} finally {
			isLoadingMore.value = false;
		}
	}

	// Reset and reload files
	function reset() {
		allFiles.value = [];
		nextCursor.value = undefined;
		hasMore.value = true;
		filesQuery.refetch();
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
			const workspaceSlug = effectiveWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			return await client.files.updateFile(workspaceSlug, fileId, updates);
		},
		onSuccess() {
			reset();
		},
	});

	const deleteFileMutation = useMutation({
		mutation: async (fileId: string) => {
			const client = $nvisyClient.value;
			const workspaceSlug = effectiveWorkspaceSlug.value;
			if (!client || !workspaceSlug) throw new Error("Not authenticated");
			await client.files.deleteFile(workspaceSlug, fileId);
		},
		onSuccess() {
			reset();
		},
	});

	const uploadFilesMutation = useMutation({
		mutation: async (files: File[]) => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			const wId = effectiveWorkspaceSlug.value;
			if (!wId) throw new Error("No workspace selected");
			return await client.files.uploadFiles(wId, files);
		},
		onSuccess() {
			reset();
		},
	});

	async function downloadFile(fileId: string, fileName: string) {
		const client = $nvisyClient.value;
		const workspaceSlug = effectiveWorkspaceSlug.value;
		if (!client || !workspaceSlug) throw new Error("Not authenticated");
		const response = await client.files.downloadFile(workspaceSlug, fileId);
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = fileName;
		a.click();
		URL.revokeObjectURL(url);
	}

	// Bulk download fetches each file individually.
	async function downloadMultiple(fileIds: string[]) {
		const client = $nvisyClient.value;
		if (!client) throw new Error("Not authenticated");
		for (const fileId of fileIds) {
			const file = allFiles.value.find((f) => f.id === fileId);
			await downloadFile(fileId, file?.displayName ?? fileId);
		}
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
