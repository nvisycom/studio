import type { Nvisy } from "@nvisy/sdk";
import type { WorkspaceDetection } from "@nvisy/sdk/datatypes";
import type {
	DetectionInput,
	DetectionProvider,
	DetectionResult,
	RestoredDetection,
} from "./types";

/*
 * The server-backed detection provider: the pipeline flow the console has always
 * used. `produce` creates a detection for the document on its pipeline, streams
 * its status until it settles, then fetches the analysis. `findLatest` restores
 * a file's most recent complete detection. It needs the active workspace id,
 * captured per call.
 */

/** States that settle a detection — its analysis is ready at "complete". */
const TERMINAL: WorkspaceDetection["status"][] = ["complete", "failed"];

/** Build a server-backed detection provider over an SDK client + workspace. */
export function createServerDetectionProvider(
	client: Nvisy,
	workspaceId: () => string,
): DetectionProvider {
	/** Stream a detection's status until it settles, reporting each tick. */
	async function waitFor(
		detectionId: string,
		onStatus?: (status: string) => void,
	): Promise<WorkspaceDetection["status"]> {
		let last: WorkspaceDetection["status"] | null = null;
		for await (const event of client.detections.streamEvents(
			workspaceId(),
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

	return {
		async produce(
			input: DetectionInput,
			onStatus?: (status: string) => void,
		): Promise<DetectionResult> {
			const ws = workspaceId();
			const created = await client.detections.createDetection(
				ws,
				input.pipelineId,
				{ documentId: input.fileId },
			);
			onStatus?.(created.status);

			const status = TERMINAL.includes(created.status)
				? created.status
				: await waitFor(created.id, onStatus);
			if (status === "failed") throw new Error("Detection failed.");

			const audit = await client.detections.getAnalysis(ws, created.id);
			return { detectionId: created.id, audit };
		},

		async findLatest(
			fileId: string,
			pipelineId?: string,
		): Promise<RestoredDetection | null> {
			const ws = workspaceId();
			const { items } = await client.detections.listDetections(ws, {
				documentId: fileId,
				limit: 100,
			});
			// Ordering isn't guaranteed by the API, so sort by startedAt ourselves.
			const latest =
				items
					.filter((d) => d.status === "complete")
					.filter((d) => !pipelineId || d.pipelineId === pipelineId)
					.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null;
			if (!latest) return null;

			const audit = await client.detections.getAnalysis(ws, latest.id);
			return {
				detectionId: latest.id,
				audit,
				pipelineId: latest.pipelineId ?? null,
			};
		},
	};
}
