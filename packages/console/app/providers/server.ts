import type { Nvisy } from "@nvisy/sdk";
import type { Audit, WorkspaceDetection } from "@nvisy/sdk/datatypes";
import type {
	DetectionInput,
	DetectionProvider,
	DetectionResult,
	DetectionSource,
} from "./types";

/*
 * The server-backed detection provider. `produce` runs a detection — a saved
 * pipeline, or a quick ad-hoc policy/labels run — streaming its status until it
 * settles, then fetches the analysis. `listForFile` returns the file's
 * detections (the switcher list) and `loadAnalysis` loads a chosen one's audit.
 * It needs the active workspace id, captured per call.
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

	/**
	 * Resolve a quick-detection source to the policy ids an ad-hoc detection runs
	 * against. An existing-policy source passes its ids through; a labels source
	 * mints (or reuses) a one-shot policy from the labels and returns its id. This
	 * is the single seam a future server `/quick` endpoint would replace — the
	 * mint-then-detect two-step lives here, not in the UI.
	 */
	async function resolveQuickPolicyIds(
		ws: string,
		source: Extract<DetectionSource, { kind: "policy" | "labels" }>,
	): Promise<string[]> {
		if (source.kind === "policy") return source.policyIds;
		// A `labels` body mints a one-shot policy, reused when an identical one
		// already exists (the API dedupes), so repeat quick runs don't pile up.
		const policy = await client.policies.createPolicy(ws, {
			source: "labels",
			labels: source.labels,
		});
		return [policy.id];
	}

	return {
		async produce(
			input: DetectionInput,
			onStatus?: (status: string) => void,
		): Promise<DetectionResult> {
			const ws = workspaceId();
			// Pipeline runs through the saved pipeline (its scope, when set,
			// overrides the pipeline's defaultScope); a quick (policy/labels) run
			// resolves to policy ids and starts an ad-hoc detection.
			const created =
				input.source.kind === "pipeline"
					? await client.detections.createDetection(
							ws,
							input.source.pipelineId,
							{
								documentId: input.fileId,
								...(input.source.scope ? { scope: input.source.scope } : {}),
							},
						)
					: await client.detections.createAdhocDetection(ws, {
							documentId: input.fileId,
							policyIds: await resolveQuickPolicyIds(ws, input.source),
							...(input.source.scope ? { scope: input.source.scope } : {}),
						});
			onStatus?.(created.status);

			const status = TERMINAL.includes(created.status)
				? created.status
				: await waitFor(created.id, onStatus);
			if (status === "failed") throw new Error("Detection failed.");

			const audit = await client.detections.getAnalysis(ws, created.id);
			return { detectionId: created.id, audit };
		},

		async listForFile(fileId: string): Promise<WorkspaceDetection[]> {
			const ws = workspaceId();
			const { items } = await client.detections.listDetections(ws, {
				documentId: fileId,
				limit: 100,
			});
			// Ordering isn't guaranteed by the API, so sort newest-first ourselves.
			return items.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
		},

		async loadAnalysis(detectionId: string): Promise<Audit> {
			return client.detections.getAnalysis(workspaceId(), detectionId);
		},
	};
}
