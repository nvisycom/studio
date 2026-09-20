import type {
	Audit,
	EditSet,
	WorkspaceRedactionResult,
} from "@nvisy/sdk/datatypes";

/**
 * Composable for redaction operations (workspace-scoped). A redaction is the
 * resource produced by applying a policy — with optional reviewer edits — to a
 * complete detection: it carries the redacted output file and its own review
 * audit. Detections are handled separately by {@link useDetections}; this owns
 * only the redaction side.
 */
export function useRedactions() {
	const { requireContext } = useWorkspaceContext();
	const { saveBlob } = useFileDownload();

	/**
	 * Redact a complete detection, producing its redacted output file. Pass
	 * `edits` to apply reviewer changes (suppress/retag) first; omit to redact
	 * exactly as detected. Returns a {@link RedactionResult} carrying
	 * `outputFileId`, the redacted document to download.
	 */
	async function createRedaction(
		detectionId: string,
		edits?: EditSet,
	): Promise<WorkspaceRedactionResult> {
		const { client, workspaceId } = requireContext();
		return await client.detections.createRedaction(
			workspaceId,
			detectionId,
			edits ? { edits } : {},
		);
	}

	/** The most recent redaction of a detection, or null if it has none yet. */
	async function findLatestForDetection(
		detectionId: string,
	): Promise<WorkspaceRedactionResult | null> {
		const { client, workspaceId } = requireContext();
		const { items } = await client.detections.listRedactions(
			workspaceId,
			detectionId,
			{ limit: 1 },
		);
		return items[0] ?? null;
	}

	/**
	 * A redaction's review audit — the trail of what it redacted and which
	 * reviewer edits were applied, keyed by redaction id.
	 */
	async function getReview(redactionId: string): Promise<Audit> {
		const { client, workspaceId } = requireContext();
		return await client.redactions.getReview(workspaceId, redactionId);
	}

	/** Download a redaction's output file, saved under `fileName`. */
	async function downloadOutput(
		outputFileId: string,
		fileName: string,
	): Promise<void> {
		const { client, workspaceId } = requireContext();
		const response = await client.documents.downloadDocument(
			workspaceId,
			outputFileId,
		);
		await saveBlob(await response.blob(), fileName);
	}

	return {
		createRedaction,
		findLatestForDetection,
		getReview,
		downloadOutput,
	};
}

/**
 * The redactions of a document — every redaction produced from any detection
 * that analyzed it, most recent first. Used by the review detail page's
 * Redactions tab (the review is scoped to a single document).
 */
export function useDocumentRedactions(documentId: MaybeRef<string>) {
	const { currentWorkspaceId } = useWorkspaceContext();

	const q = workspaceQuery<WorkspaceRedactionResult[]>(
		"document-redactions",
		async ({ client, workspaceId }) => {
			const page = await client.redactions.listRedactions(workspaceId, {
				documentId: toValue(documentId),
			});
			return page.items;
		},
		{
			key: () => [
				"document-redactions",
				currentWorkspaceId.value,
				toValue(documentId),
			],
			// No document selected yet — don't query with an empty id.
			enabled: () => !!toValue(documentId),
			staleTime: 0,
		},
	);

	return {
		redactions: computed(() => q.data.value ?? []),
		isLoading: q.isLoading,
		error: q.error,
		refresh: q.refresh,
	};
}
