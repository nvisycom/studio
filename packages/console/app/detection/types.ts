import type { Audit, WorkspaceDetection } from "@nvisy/sdk/datatypes";

/*
 * The detection seam: a narrow interface for the two backend operations the
 * studio delegates — running a detection and restoring a file's latest one. It
 * is deliberately NOT a full unified interface over the whole detection
 * lifecycle: pipeline selection, SSE status streaming, and server-side storage
 * have no honest local equivalent, so those stay in `useStudioDetection` (server
 * paths hidden offline). Only the "produce / restore an Audit" boundary, where
 * the two backends genuinely agree (on the shared `Audit` type), is seamed.
 *
 * ServerDetectionProvider is the pipeline flow (createDetection → stream →
 * getAnalysis); LocalDetectionProvider invokes the on-device engine. The studio
 * composable calls the injected provider and never knows which is in play.
 */

/** Everything a detection run needs, from data the studio page already holds. */
export interface DetectionInput {
	/** The document id (server reference / local file identity). */
	fileId: string;
	/** The document's display name. */
	name: string;
	/** The pipeline to run — its policy set. */
	pipelineId: string;
	/** The document bytes, loaded lazily (the local engine needs them; the
	 *  server path, which has the stored document, ignores this). */
	bytes: () => Promise<Uint8Array>;
}

/** The result of a detection: the audit, and the detection's id when one exists
 *  (server detections have an id; a local run's id is its stored run id). */
export interface DetectionResult {
	detectionId: string | null;
	audit: Audit;
}

/** A restored prior detection for a file, plus the pipeline that produced it. */
export interface RestoredDetection extends DetectionResult {
	/** The pipeline the restored detection ran under, to adopt into the picker. */
	pipelineId: string | null;
}

/** The detection backend the studio runs against. */
export interface DetectionProvider {
	/** Run a detection over the document, returning its audit. */
	produce(
		input: DetectionInput,
		onStatus?: (status: string) => void,
	): Promise<DetectionResult>;

	/** The most recent detection for a file (optionally a specific pipeline's),
	 *  or `null` if none — used to restore a file's audit on open. */
	findLatest(
		fileId: string,
		pipelineId?: string,
	): Promise<RestoredDetection | null>;

	/**
	 * The workspace's detection history, newest-first — backs the detections page.
	 *
	 * Optional: the server provider leaves this unset, because the detections page
	 * fetches the server's own paginated list directly (status/trigger filters,
	 * cursor paging — no local equivalent). The local provider implements it over
	 * the on-device runs, adapted to the `WorkspaceDetection` shape the page
	 * renders. When a provider sets it, the page reads history through the seam;
	 * otherwise it falls back to the SDK list.
	 */
	list?(workspaceId: string): Promise<WorkspaceDetection[]>;

	/**
	 * A detection's analysis (its audit) by id. Optional, paired with {@link list}:
	 * the local provider returns the stored run's audit; the server provider leaves
	 * it unset and the detections page uses the SDK's `getAnalysis`.
	 */
	getAnalysis?(detectionId: string): Promise<Audit>;
}
