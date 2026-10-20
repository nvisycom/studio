import { invoke } from "@tauri-apps/api/core";
import type {
	Audit,
	Policy,
	WorkspaceDetection,
	WorkspacePolicy,
} from "@nvisy/sdk/datatypes";
import type {
	DetectionInput,
	DetectionProvider,
	DetectionResult,
	RestoredDetection,
} from "#console/detection/types";
import type { Repository } from "#console/repositories/types";
import { locateDocument } from "~/repositories/folder";
import { parseBody, storeGet } from "~/repositories/store";
import {
	findLatestRun,
	getRun,
	listRuns,
	type LocalRun,
	saveRun,
} from "~/repositories/runs";

/*
 * The local, engine-backed detection provider: the desktop app's detection path
 * when offline. `produce` resolves the pipeline's policies, gathers the document
 * bytes the studio already holds, and invokes the on-device engine — synchronous,
 * in-process, returning the audit directly (no pipeline job, no status stream).
 * `findLatest` restores a file's most recent local run from the store.
 *
 * This is desktop-only (it imports Tauri). It is injected into the detection seam
 * by the desktop plugin; the shared layer never imports it.
 */

/** Resolve a pipeline's policy definitions — what the engine actually runs. */
async function resolvePolicies(
	repository: Repository,
	workspaceId: () => string,
	pipelineId: string,
): Promise<Policy[]> {
	const ws = workspaceId();
	const pipeline = await repository.pipelines.getPipeline(ws, pipelineId);
	const policyIds = pipeline.definition.policyIds ?? [];
	const policies = await Promise.all(
		policyIds.map((id) => repository.policies.getPolicy(ws, id)),
	);
	// The engine takes the governance `Policy` — the policy's definition, not the
	// workspace wrapper.
	return policies.map((p: WorkspacePolicy) => p.definition);
}

/** Total entities an audit found, across every modality part. */
function countEntities(audit: Audit): number {
	return (audit.report.parts ?? []).reduce(
		(total, part) => total + (part.entities?.length ?? 0),
		0,
	);
}

/**
 * Adapt an on-device run to the `WorkspaceDetection` shape the detections page
 * renders, so the history list works offline with no change to the page.
 *
 * A run is synchronous and always-complete, so the fields the page reads that a
 * local run has no honest source for are synthesized: `status` is always
 * `complete` (the engine returns the audit or throws — there is no pending/
 * failed row to list), the trigger is the local user, and there is no owning
 * account. The rest map directly (`fileId`→`inputDocumentId`, `fileName`→
 * `inputDocumentName`, `ranAt`→`startedAt`/`completedAt`). `entityCount` rides
 * in `metadata.tags` so the detail/export paths can surface it later without a
 * server round-trip.
 */
function runToDetection(
	run: LocalRun,
	workspaceHandle: string,
): WorkspaceDetection {
	return {
		id: run.id,
		inputDocumentId: run.fileId,
		inputDocumentName: run.fileName,
		pipelineId: run.pipelineId,
		status: "complete",
		triggerType: "user",
		triggeredBy: { id: "local", username: "local" },
		startedAt: run.ranAt,
		completedAt: run.ranAt,
		metadata: { tags: [`entities:${run.entityCount}`] },
		workspaceId: run.workspaceId,
		workspaceHandle,
	};
}

/** Build the local, engine-backed detection provider. */
export function createLocalDetectionProvider(
	repository: Repository,
	workspaceId: () => string,
): DetectionProvider {
	return {
		async produce(input: DetectionInput): Promise<DetectionResult> {
			const ws = workspaceId();
			const policies = await resolvePolicies(
				repository,
				workspaceId,
				input.pipelineId,
			);
			// The document already lives in the workspace folder, so the engine
			// reads it from disk by (folder, path) — no bytes cross IPC. The engine
			// runs synchronously and returns the audit directly (no server id).
			const document = await locateDocument(ws, input.fileId);
			const audit = await invoke<Audit>("detect", {
				document,
				policies,
			});

			// Persist the run so the detections list and restore-latest work offline.
			// The run id IS the detection id for the local path.
			const runId = crypto.randomUUID();
			await saveRun({
				id: runId,
				workspaceId: ws,
				pipelineId: input.pipelineId,
				fileId: input.fileId,
				fileName: input.name,
				entityCount: countEntities(audit),
				ranAt: new Date().toISOString(),
				audit,
			});

			return { detectionId: runId, audit };
		},

		async findLatest(
			fileId: string,
			pipelineId?: string,
		): Promise<RestoredDetection | null> {
			const run = await findLatestRun(workspaceId(), fileId, pipelineId);
			if (!run) return null;
			return {
				detectionId: run.id,
				audit: run.audit,
				pipelineId: run.pipelineId,
			};
		},

		async list(ws: string): Promise<WorkspaceDetection[]> {
			// The handle is display-only on the row; read it once from the stored
			// workspace record (workspace listing isn't on the per-workspace
			// repository seam anymore). Fall back to the id if the record is gone.
			const record = await storeGet("workspaces", ws);
			const handle = record ? parseBody<{ handle: string }>(record).handle : ws;
			const runs = await listRuns(ws);
			return runs.map((run) => runToDetection(run, handle));
		},

		async getAnalysis(detectionId: string): Promise<Audit> {
			const run = await getRun(detectionId);
			if (!run) throw new Error("No local run for that detection.");
			return run.audit;
		},
	};
}
