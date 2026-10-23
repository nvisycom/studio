import type {
	Audit,
	DocumentContext,
	WorkspaceDetection,
} from "@nvisy/sdk/datatypes";

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

/**
 * How a detection run decides *what to detect*. Three shapes that all resolve to
 * the same thing (a set of policies to run), differing only in where that set
 * comes from:
 *
 * - `pipeline` — a saved pipeline's policy set (the server path runs it by id;
 *   the local path resolves the pipeline's `policyIds`).
 * - `policy` — a quick ad-hoc run against existing workspace policies, named
 *   directly. No saved pipeline.
 * - `labels` — a quick ad-hoc run that mints (or reuses) a one-shot policy from
 *   a set of built-in labels, then runs that. The no-setup path: detect these
 *   entity types without authoring or saving anything.
 *
 * All three carry an optional per-run {@link DocumentContext} scope: for `policy`
 * and `labels` it is the run's scope; for `pipeline` it overrides the pipeline's
 * saved `defaultScope` (absent falls back to that default).
 */
export type DetectionSource =
	| { kind: "pipeline"; pipelineId: string; scope?: DocumentContext }
	| { kind: "policy"; policyIds: string[]; scope?: DocumentContext }
	| { kind: "labels"; labels: string[]; scope?: DocumentContext };

/** Everything a detection run needs, from data the studio page already holds. */
export interface DetectionInput {
	/** The document id (server reference / local file identity). */
	fileId: string;
	/** The document's display name. */
	name: string;
	/** What to detect: a saved pipeline, or a quick ad-hoc policy/labels run. */
	source: DetectionSource;
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

/** The detection backend the studio runs against. */
export interface DetectionProvider {
	/** Run a detection over the document, returning its audit. */
	produce(
		input: DetectionInput,
		onStatus?: (status: string) => void,
	): Promise<DetectionResult>;

	/**
	 * Every detection for a file, newest-first — the studio shows them as a list
	 * the reviewer picks from (and opens the newest on file open). Server: the
	 * workspace's detections filtered to the document; local: the file's stored
	 * runs.
	 */
	listForFile(fileId: string): Promise<WorkspaceDetection[]>;

	/** Load a specific detection's audit, to view it when picked from the list. */
	loadAnalysis(detectionId: string): Promise<Audit>;

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
