import type {
	Audit,
	CreateDetection,
	Detection,
	RedactionResult,
	WorkspaceDetectionsQuery,
} from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** States that settle a detection — its analysis is ready at "complete". */
const TERMINAL: Detection["status"][] = ["complete", "failed"];

/** Detections list filter: the API's query plus a pipeline slug, which routes
 * to the pipeline-scoped list endpoint. */
export interface DetectionsFilter extends WorkspaceDetectionsQuery {
	pipelineSlug?: string;
}

/**
 * Composable for detection operations (workspace-scoped). Pass a reactive
 * `filter` to scope the detections list server-side (status, trigger, pipeline).
 */
export function useDetections(filter?: MaybeRefOrGetter<DetectionsFilter>) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();

	const activeFilter = computed<DetectionsFilter>(() => toValue(filter ?? {}));

	const detectionsQuery = workspaceQuery(
		"detections",
		async ({ client, workspaceSlug }) => {
			const { pipelineSlug, ...query } = activeFilter.value;
			// A pipeline filter uses the pipeline-scoped endpoint (the workspace
			// list only filters by pipelineId, which isn't exposed on summaries).
			const result = pipelineSlug
				? await client.detections.listPipelineDetections(
						workspaceSlug,
						pipelineSlug,
						query,
					)
				: await client.detections.listDetections(workspaceSlug, query);
			return result.items;
		},
		{
			key: () => [
				"detections",
				currentWorkspaceSlug.value,
				JSON.stringify(activeFilter.value),
			],
		},
	);

	async function getDetection(detectionId: string): Promise<Detection> {
		const { client, workspaceSlug } = requireContext();
		return await client.detections.getDetection(workspaceSlug, detectionId);
	}

	/** Fetch a detection's analysis (the audit — detected entities + provenance). */
	async function getAnalysis(detectionId: string): Promise<Audit> {
		const { client, workspaceSlug } = requireContext();
		return await client.detections.getAnalysis(workspaceSlug, detectionId);
	}

	/** Download a detection's audit as JSON or CSV, saved under `fileName`. */
	async function downloadAudit(
		detectionId: string,
		format: "json" | "csv",
		fileName: string,
	): Promise<void> {
		const { client, workspaceSlug } = requireContext();
		const response = await client.detections.downloadAudit(
			workspaceSlug,
			detectionId,
			{ format },
		);
		const url = URL.createObjectURL(await response.blob());
		triggerBrowserDownload(url, fileName);
	}

	/**
	 * The most recent complete detection for a file (its analysis is ready), or
	 * null if the file has never been analyzed. Used to restore a file's
	 * detections when it's reopened. Ordering isn't guaranteed by the API, so we
	 * sort by `startedAt` ourselves.
	 */
	async function findLatestForFile(
		fileId: string,
		pipelineSlug?: string,
	): Promise<Detection | null> {
		const { client, workspaceSlug } = requireContext();
		const { items } = await client.detections.listDetections(workspaceSlug, {
			fileId,
			limit: 100,
		});
		return (
			items
				.filter((d) => d.status === "complete")
				.filter((d) => !pipelineSlug || d.pipelineSlug === pipelineSlug)
				.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
		);
	}

	/**
	 * Apply redactions to a complete detection, producing its redacted output
	 * file. Redaction is its own resource: this returns a {@link RedactionResult}
	 * carrying `outputFileId`, the redacted document to download.
	 */
	async function createRedaction(
		detectionId: string,
	): Promise<RedactionResult> {
		const { client, workspaceSlug } = requireContext();
		return await client.detections.createRedaction(
			workspaceSlug,
			detectionId,
			{},
		);
	}

	/** The most recent redaction of a detection, or null if it has none yet. */
	async function findLatestRedaction(
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
		const url = URL.createObjectURL(await response.blob());
		triggerBrowserDownload(url, fileName);
	}

	/**
	 * Stream a detection's status changes over SSE until it settles, then return
	 * the final status. Yields the current status first, then each transition.
	 * `onStatus` reports every tick so the UI can show live progress.
	 */
	async function waitForDetection(
		detectionId: string,
		onStatus?: (status: Detection["status"]) => void,
	): Promise<Detection["status"]> {
		const { client, workspaceSlug } = requireContext();
		let last: Detection["status"] | null = null;
		for await (const event of client.detections.streamEvents(
			workspaceSlug,
			detectionId,
		)) {
			last = event.status;
			onStatus?.(event.status);
			if (TERMINAL.includes(event.status)) break;
		}
		if (!last)
			throw new Error("The detection stream closed before any status.");
		return last;
	}

	/**
	 * Run a detection end-to-end: create it for `fileId` on `pipelineSlug`, stream
	 * its status until it completes, then fetch its analysis. `onStatus` reports
	 * each transition. Throws if the detection fails.
	 */
	async function runDetection(
		pipelineSlug: string,
		body: CreateDetection,
		onStatus?: (status: Detection["status"]) => void,
	): Promise<{ detectionId: string; audit: Audit }> {
		const { client, workspaceSlug } = requireContext();
		const created = await client.detections.createDetection(
			workspaceSlug,
			pipelineSlug,
			body,
		);
		onStatus?.(created.status);

		const status = TERMINAL.includes(created.status)
			? created.status
			: await waitForDetection(created.id, onStatus);

		if (status === "failed") {
			throw new Error("Detection failed.");
		}

		const audit = await getAnalysis(created.id);
		return { detectionId: created.id, audit };
	}

	return {
		// Query state
		detections: detectionsQuery.data,
		isLoading: detectionsQuery.isLoading,
		error: detectionsQuery.error,
		refresh: detectionsQuery.refresh,

		// Single detection + analysis flow
		getDetection,
		getAnalysis,
		downloadAudit,
		findLatestForFile,
		runDetection,

		// Redaction
		createRedaction,
		findLatestRedaction,
		downloadOutput,
	};
}
