import { invoke } from "@tauri-apps/api/core";
import type {
	Audit,
	DocumentContext,
	Policy,
	WorkspaceDetection,
	WorkspacePolicy,
} from "@nvisy/sdk/datatypes";
import type {
	DetectionInput,
	DetectionProvider,
	DetectionResult,
	DetectionSource,
} from "#console/providers/types";
import type { Repository } from "#console/repositories/types";
import { locateDocument } from "~/repositories/folder";
import { parseBody, storeGet } from "~/repositories/store";
import { getRun, listRuns, type LocalRun, saveRun } from "~/repositories/runs";

/*
 * The local, engine-backed detection provider: the desktop app's detection path
 * when offline. `produce` resolves the pipeline's policies, gathers the document
 * bytes the studio already holds, and invokes the on-device engine — synchronous,
 * in-process, returning the audit directly (no pipeline job, no status stream).
 * `listForFile` lists a file's stored runs and `loadAnalysis` loads one's audit.
 *
 * This is desktop-only (it imports Tauri). It is injected into the detection seam
 * by the desktop plugin; the shared layer never imports it.
 */

/**
 * Resolve a detection source to the policy definitions the engine runs. A
/** What the engine needs to run a detection: the governance policies and the
 *  effective per-run scope. */
interface ResolvedSource {
	/** The policy ids the run executes against (persisted so it can be redacted
	 *  again offline). */
	policyIds: string[];
	policies: Policy[];
	scope?: DocumentContext;
}

/**
 * Resolve a detection source to what the engine runs. A policy run takes the
 * given ids; a labels run mints (or reuses) a derived policy from the labels —
 * the same two shapes the server path resolves, done against the local
 * repository. Returns the governance `Policy` definitions (not the workspace
 * wrappers), which is what the engine takes, plus the effective scope.
 */
async function resolveSource(
	repository: Repository,
	workspaceId: () => string,
	source: DetectionSource,
): Promise<ResolvedSource> {
	const ws = workspaceId();
	let policyIds: string[];
	if (source.kind === "policy") {
		policyIds = source.policyIds;
	} else {
		// A labels source mints a derived policy (reused if identical), the same
		// two-step the server path isolates — here against the local repository.
		const policy = await repository.policies.createPolicy(ws, {
			source: "labels",
			labels: source.labels,
		});
		policyIds = [policy.id];
	}
	const policies = await Promise.all(
		policyIds.map((id) => repository.policies.getPolicy(ws, id)),
	);
	return {
		policyIds,
		policies: policies.map((p: WorkspacePolicy) => p.definition),
		scope: source.scope,
	};
}

/**
 * The workspace's display handle for a detection row, read once from the stored
 * workspace record (workspace listing isn't on the per-workspace repository
 * seam). Falls back to the id if the record is gone.
 */
async function workspaceHandle(ws: string): Promise<string> {
	const record = await storeGet("workspaces", ws);
	return record ? parseBody<{ handle: string }>(record).handle : ws;
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
 * failed row to list), and there is no owning account beyond the local user.
 * The rest map directly (`fileId`→`inputDocumentId`, `fileName`→
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
		status: "complete",
		triggeredBy: { id: "local", username: "local" },
		startedAt: run.ranAt,
		completedAt: run.ranAt,
		metadata: { tags: [`entities:${run.entityCount}`] },
		workspaceId: run.workspaceId,
		workspaceHandle,
		// On-device runs don't persist reviewer edits server-side, so there's no
		// accumulated edit set — revision 0.
		editSetRev: 0,
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
			const { policyIds, policies, scope } = await resolveSource(
				repository,
				workspaceId,
				input.source,
			);
			// The document already lives in the workspace folder, so the engine
			// reads it from disk by (workspaceId, path) — no bytes cross IPC, and the
			// id authorizes the folder. Runs synchronously, returns the audit directly.
			// `scope` is the effective per-run scope — the same scope a server run
			// receives.
			const document = await locateDocument(ws, input.fileId);
			const audit = await invoke<Audit>("detect", {
				document,
				policies,
				...(scope ? { context: scope } : {}),
			});

			// Persist the run so the detections list and restore-latest work offline.
			// The run id IS the detection id for the local path.
			const runId = crypto.randomUUID();
			await saveRun({
				id: runId,
				workspaceId: ws,
				policyIds,
				fileId: input.fileId,
				fileName: input.name,
				entityCount: countEntities(audit),
				ranAt: new Date().toISOString(),
				audit,
			});

			return { detectionId: runId, audit };
		},

		async listForFile(fileId: string): Promise<WorkspaceDetection[]> {
			const ws = workspaceId();
			const handle = await workspaceHandle(ws);
			const runs = await listRuns(ws);
			return runs
				.filter((run) => run.fileId === fileId)
				.sort((a, b) => b.ranAt.localeCompare(a.ranAt))
				.map((run) => runToDetection(run, handle));
		},

		async loadAnalysis(detectionId: string): Promise<Audit> {
			const run = await getRun(detectionId);
			if (!run) throw new Error("No local run for that detection.");
			return run.audit;
		},

		async list(ws: string): Promise<WorkspaceDetection[]> {
			const handle = await workspaceHandle(ws);
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
