import type { UpdateFile, ListFiles } from "@nvisy/sdk/datatypes";

export interface UseFilesOptions {
	query?: MaybeRef<ListFiles>;
	pageSize?: number;
}

/** Outcome of a bulk download: how many saved vs failed, and whether the user
 * cancelled partway (desktop) so the caller can report accurately. */
export interface BulkDownloadResult {
	saved: number;
	failed: number;
	cancelled: boolean;
}

/**
 * Composable for file operations with infinite scroll support.
 */
export function useFiles(options: UseFilesOptions = {}) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();
	const { saveBlob } = useFileDownload();

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

	// Batch delete in one request, returning which ids were deleted vs skipped
	// (unknown, already gone, or held by an in-progress detection). Preferred for
	// bulk deletes over looping the single-delete mutation.
	const deleteFilesMutation = workspaceMutation(
		({ client, workspaceSlug }, fileIds: string[]) =>
			client.files.deleteFiles(workspaceSlug, fileIds),
		{ invalidates: "files" },
	);

	const uploadFilesMutation = workspaceMutation(
		({ client, workspaceSlug }, files: File[]) =>
			client.files.uploadFiles(workspaceSlug, files),
		{ invalidates: "files" },
	);

	// Returns whether the file was saved (always true on the web; false if the
	// user cancelled a native save panel on desktop). A fetch or write failure
	// throws — the caller decides how to surface it.
	async function downloadFile(fileId: string, fileName: string) {
		const { client, workspaceSlug } = requireContext();
		const response = await client.files.downloadFile(workspaceSlug, fileId);
		return saveBlob(await response.blob(), fileName);
	}

	// Bulk download fetches and saves each file individually. A single file's
	// failure doesn't abort the rest (they're independent); we tally failures so
	// the caller can report them. A user cancel (desktop) does stop the batch —
	// once they dismiss the panel they don't want the remaining files' panels
	// popping up one after another.
	async function downloadMultiple(
		fileIds: string[],
	): Promise<BulkDownloadResult> {
		let saved = 0;
		let failed = 0;
		for (const fileId of fileIds) {
			const file = files.value.find((f) => f.id === fileId);
			try {
				const wasSaved = await downloadFile(
					fileId,
					file?.displayName ?? fileId,
				);
				if (!wasSaved) return { saved, failed, cancelled: true };
				saved++;
			} catch {
				failed++;
			}
		}
		return { saved, failed, cancelled: false };
	}

	/** Fetch a single file's metadata by id (e.g. to name a preselected file). */
	async function getFile(fileId: string) {
		const { client, workspaceSlug } = requireContext();
		return await client.files.getFile(workspaceSlug, fileId);
	}

	return {
		// Query state
		files,
		isLoading: filesQuery.isLoading,
		error: filesQuery.error,
		refresh: filesQuery.refresh,

		// Single file
		getFile,

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

		deleteFilesAsync: deleteFilesMutation.mutateAsync,
		isDeletingBatch: deleteFilesMutation.isLoading,

		uploadFiles: uploadFilesMutation.mutate,
		uploadFilesAsync: uploadFilesMutation.mutateAsync,
		isUploading: uploadFilesMutation.isLoading,
		uploadError: uploadFilesMutation.error,

		// Actions
		downloadFile,
		downloadMultiple,
	};
}
