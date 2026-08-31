import type { Audit, EditSet, RedactionResult } from "@nvisy/sdk/datatypes";

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
	): Promise<RedactionResult> {
		const { client, workspaceSlug } = requireContext();
		return await client.detections.createRedaction(
			workspaceSlug,
			detectionId,
			edits ? { edits } : {},
		);
	}

	/** The most recent redaction of a detection, or null if it has none yet. */
	async function findLatestForDetection(
		detectionId: string,
	): Promise<RedactionResult | null> {
		const { client, workspaceSlug } = requireContext();
		const { items } = await client.detections.listRedactions(
			workspaceSlug,
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
		const { client, workspaceSlug } = requireContext();
		return await client.redactions.getReview(workspaceSlug, redactionId);
	}

	/** Download a redaction's output file, saved under `fileName`. */
	async function downloadOutput(
		outputFileId: string,
		fileName: string,
	): Promise<void> {
		const { client, workspaceSlug } = requireContext();
		const response = await client.files.downloadFile(
			workspaceSlug,
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
