import type { Audit } from "@nvisy/sdk/datatypes";
import {
	parseBody,
	type StoreRecord,
	storeGet,
	storeList,
	storeUpsert,
} from "./store";

/*
 * The on-device run record — the local counterpart to a server detection, but an
 * honest local shape, NOT a `WorkspaceDetection`. A server detection is a log of
 * an async pipeline job (pipeline, status lifecycle, account, stored-document
 * reference); on-device detection is a synchronous engine call on a transient
 * document. A LocalRun records just what actually happened: which pipeline ran,
 * on what file, how many entities were found, when, and the audit (so the run can
 * be reviewed and redacted later without re-running).
 *
 * Runs are stored in the `detections` table and power the studio's restore-latest
 * (re-open a file's audit) and, later, an offline runs list.
 */

/** One on-device detection run. */
export interface LocalRun {
	id: string;
	workspaceId: string;
	/** The local pipeline that ran. */
	pipelineId: string;
	/** The document this ran over (documents are transient — we keep the name). */
	fileId: string;
	fileName: string;
	/** How many entities the detection found, for the list display. */
	entityCount: number;
	ranAt: string;
	/** The detection result, kept so the run can be restored and redacted. */
	audit: Audit;
}

/** Parse a run's body (the audit is serialized within it). */
function parseRun(record: StoreRecord): LocalRun {
	return parseBody<LocalRun>(record);
}

/** Persist a run to the store. */
export async function saveRun(run: LocalRun): Promise<void> {
	await storeUpsert("detections", {
		id: run.id,
		workspaceId: run.workspaceId,
		name: run.fileName,
		// `kind` carries the pipeline id, so the file's latest run for a pipeline
		// can be found without parsing every body.
		kind: run.pipelineId,
		updatedAt: run.ranAt,
		body: JSON.stringify(run),
	});
}

/** One run by id, or null if absent. */
export async function getRun(id: string): Promise<LocalRun | null> {
	const record = await storeGet("detections", id);
	return record ? parseRun(record) : null;
}

/**
 * All runs in a workspace, newest-first — the detection-history list offline.
 *
 * The store lists `detections` newest-first and workspace-scoped already, so
 * this just maps each record's body back to a run. Unbounded at a single user's
 * scale (the store caps a page at 1000, the same bound restore-latest uses).
 */
export async function listRuns(workspaceId: string): Promise<LocalRun[]> {
	const page = await storeList("detections", { workspaceId, limit: 1000 });
	return page.items.map(parseRun);
}
