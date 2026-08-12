import type { UpdateFile, ListFiles } from "@nvisy/sdk/datatypes";

export interface UseFilesOptions {
	query?: MaybeRef<ListFiles>;
	pageSize?: number;
}

/**
 * Composable for file operations with infinite scroll support.
 */
export function useFiles(options: UseFilesOptions = {}) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();

	const pageSize = options.pageSize ?? 50;
	const queryParams = computed<ListFiles>(() => ({
		...toValue(options.query ?? {}),
	}));

	const filesQuery = workspaceQuery(
		"files",
		({ client, workspaceSlug }) =>
			client.files.listFiles(workspaceSlug, {
				...queryParams.value,
				limit: pageSize,
			}),
		{
			key: () => [
				"files",
				currentWorkspaceSlug.value,
				JSON.stringify(queryParams.value),
			],
		},
	);

	const {
		items: files,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(filesQuery.data, (after) => {
		const { client, workspaceSlug } = requireContext();
		return client.files.listFiles(workspaceSlug, {
			...queryParams.value,
			after,
			limit: pageSize,
		});
	});

	const updateFileMutation = workspaceMutation(
		(
			{ client, workspaceSlug },
			{ fileId, updates }: { fileId: string; updates: UpdateFile },
		) => client.files.updateFile(workspaceSlug, fileId, updates),
		{ invalidates: "files" },
	);

	const deleteFileMutation = workspaceMutation(
		({ client, workspaceSlug }, fileId: string) =>
			client.files.deleteFile(workspaceSlug, fileId),
		{ invalidates: "files" },
	);

	const uploadFilesMutation = workspaceMutation(
		({ client, workspaceSlug }, files: File[]) =>
			client.files.uploadFiles(workspaceSlug, files),
		{ invalidates: "files" },
	);

	async function downloadFile(fileId: string, fileName: string) {
		const { client, workspaceSlug } = requireContext();
		const url = await fetchFileContentUrl(client, workspaceSlug, fileId);
		triggerBrowserDownload(url, fileName);
	}

	// Bulk download fetches each file individually.
	async function downloadMultiple(fileIds: string[]) {
		for (const fileId of fileIds) {
			const file = files.value.find((f) => f.id === fileId);
			await downloadFile(fileId, file?.displayName ?? fileId);
		}
	}

	return {
		// Query state
		files,
		isLoading: filesQuery.isLoading,
		error: filesQuery.error,
		refresh: filesQuery.refresh,

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
