import type {
	UpdateWorkspaceDocument,
	ListWorkspaceDocuments,
} from "@nvisy/sdk/datatypes";

export interface UseDocumentsOptions {
	query?: MaybeRef<ListWorkspaceDocuments>;
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
 * Composable for document operations with infinite scroll support.
 */
export function useDocuments(options: UseDocumentsOptions = {}) {
	const { requireContext, currentWorkspaceId } = useWorkspaceContext();
	const { saveBlob } = useFileDownload();

	const pageSize = options.pageSize ?? 50;
	const queryParams = computed<ListWorkspaceDocuments>(() => ({
		...toValue(options.query ?? {}),
	}));

	const documentsQuery = workspaceQuery(
		"documents",
		({ client, workspaceId }) =>
			client.documents.listDocuments(workspaceId, {
				...queryParams.value,
				limit: pageSize,
			}),
		{
			key: () => [
				"documents",
				currentWorkspaceId.value,
				JSON.stringify(queryParams.value),
			],
		},
	);

	const {
		items: documents,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(documentsQuery.data, (after) => {
		const { client, workspaceId } = requireContext();
		return client.documents.listDocuments(workspaceId, {
			...queryParams.value,
			after,
			limit: pageSize,
		});
	});

	const updateDocumentMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				documentId,
				updates,
			}: { documentId: string; updates: UpdateWorkspaceDocument },
		) => client.documents.updateDocument(workspaceId, documentId, updates),
		{ invalidates: "documents" },
	);

	const deleteDocumentMutation = workspaceMutation(
		({ client, workspaceId }, documentId: string) =>
			client.documents.deleteDocument(workspaceId, documentId),
		{ invalidates: "documents" },
	);

	// Batch delete in one request, returning which ids were deleted vs skipped
	// (unknown, already gone, or held by an in-progress detection). Preferred for
	// bulk deletes over looping the single-delete mutation.
	const deleteDocumentsMutation = workspaceMutation(
		({ client, workspaceId }, documentIds: string[]) =>
			client.documents.deleteDocuments(workspaceId, documentIds),
		{ invalidates: "documents" },
	);

	const uploadDocumentsMutation = workspaceMutation(
		({ client, workspaceId }, files: File[]) =>
			client.documents.uploadDocuments(workspaceId, files),
		{ invalidates: "documents" },
	);

	// Returns whether the document was saved (always true on the web; false if
	// the user cancelled a native save panel on desktop). A fetch or write
	// failure throws — the caller decides how to surface it.
	async function downloadDocument(documentId: string, fileName: string) {
		const { client, workspaceId } = requireContext();
		const response = await client.documents.downloadDocument(
			workspaceId,
			documentId,
		);
		return saveBlob(await response.blob(), fileName);
	}

	// Bulk download fetches and saves each document individually. A single
	// document's failure doesn't abort the rest (they're independent); we tally
	// failures so the caller can report them. A user cancel (desktop) does stop
	// the batch — once they dismiss the panel they don't want the remaining
	// documents' panels popping up one after another.
	async function downloadMultiple(
		documentIds: string[],
	): Promise<BulkDownloadResult> {
		let saved = 0;
		let failed = 0;
		for (const documentId of documentIds) {
			const document = documents.value.find((d) => d.id === documentId);
			try {
				const wasSaved = await downloadDocument(
					documentId,
					document?.displayName ?? documentId,
				);
				if (!wasSaved) return { saved, failed, cancelled: true };
				saved++;
			} catch {
				failed++;
			}
		}
		return { saved, failed, cancelled: false };
	}

	/** Fetch a single document's metadata by id (e.g. to name a preselected one). */
	async function getDocument(documentId: string) {
		const { client, workspaceId } = requireContext();
		return await client.documents.getDocument(workspaceId, documentId);
	}

	return {
		// Query state
		documents,
		isLoading: documentsQuery.isLoading,
		error: documentsQuery.error,
		refresh: documentsQuery.refresh,

		// Single document
		getDocument,

		// Infinite scroll
		loadMore,
		hasMore,
		isLoadingMore,

		// Mutations
		updateDocument: updateDocumentMutation.mutate,
		updateDocumentAsync: updateDocumentMutation.mutateAsync,
		isUpdating: updateDocumentMutation.isLoading,
		updateError: updateDocumentMutation.error,

		deleteDocument: deleteDocumentMutation.mutate,
		deleteDocumentAsync: deleteDocumentMutation.mutateAsync,
		isDeleting: deleteDocumentMutation.isLoading,
		deleteError: deleteDocumentMutation.error,

		deleteDocumentsAsync: deleteDocumentsMutation.mutateAsync,
		isDeletingBatch: deleteDocumentsMutation.isLoading,

		uploadDocuments: uploadDocumentsMutation.mutate,
		uploadDocumentsAsync: uploadDocumentsMutation.mutateAsync,
		isUploading: uploadDocumentsMutation.isLoading,
		uploadError: uploadDocumentsMutation.error,

		// Actions
		downloadDocument,
		downloadMultiple,
	};
}
