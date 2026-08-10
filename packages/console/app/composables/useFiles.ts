import type { UpdateFile, ListFiles } from "@nvisy/sdk/datatypes";

export interface UseFilesOptions {
	workspaceSlug?: MaybeRef<string | null>;
	query?: MaybeRef<ListFiles>;
	pageSize?: number;
}

/**
 * Composable for file operations with infinite scroll support.
 */
export function useFiles(options: UseFilesOptions = {}) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();

	// Callers may target a specific workspace; otherwise the active one.
	const workspaceSlug = computed(
		() =>
			(options.workspaceSlug
				? toValue(options.workspaceSlug)
				: currentWorkspaceSlug.value) || "",
	);
	const pageSize = options.pageSize ?? 50;
	const queryParams = computed<ListFiles>(() => ({
		...toValue(options.query ?? {}),
	}));

	const filesQuery = workspaceQuery(
		"files",
		({ client }) =>
			client.files.listFiles(workspaceSlug.value, {
				...queryParams.value,
				limit: pageSize,
			}),
		{
			key: () => [
				"files",
				workspaceSlug.value,
				JSON.stringify(queryParams.value),
			],
			enabled: () => !!workspaceSlug.value,
		},
	);

	const {
		items: files,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(filesQuery.data, (after) => {
		const { client } = requireContext();
		return client.files.listFiles(workspaceSlug.value, {
			...queryParams.value,
			after,
			limit: pageSize,
		});
	});

	const updateFileMutation = workspaceMutation(
		(
			{ client },
			{ fileId, updates }: { fileId: string; updates: UpdateFile },
		) => client.files.updateFile(workspaceSlug.value, fileId, updates),
		{ invalidates: filesQuery },
	);

	const deleteFileMutation = workspaceMutation(
		({ client }, fileId: string) =>
			client.files.deleteFile(workspaceSlug.value, fileId),
		{ invalidates: filesQuery },
	);

	const uploadFilesMutation = workspaceMutation(
		({ client }, files: File[]) =>
			client.files.uploadFiles(workspaceSlug.value, files),
		{ invalidates: filesQuery },
	);

	async function downloadFile(fileId: string, fileName: string) {
		const { client } = requireContext();
		const response = await client.files.downloadFile(
			workspaceSlug.value,
			fileId,
		);
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
