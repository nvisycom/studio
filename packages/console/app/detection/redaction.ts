import type { Audit, EditSet } from "@nvisy/sdk/datatypes";

/*
 * The redaction seam — the mirror of the detection seam, over the shared
 * `EditSet` the reviewer builds. The server applies edits to a stored detection
 * and returns an output file id; the local engine applies them in-process and
 * returns the redacted bytes. The two produce different outputs, so
 * `RedactionOutput` is a union, and the studio routes the download accordingly.
 */

/** A redaction's output: a server file id, or local bytes to save directly. */
export type RedactionOutput =
	| { kind: "server"; fileId: string; fileName: string }
	| { kind: "local"; bytes: Uint8Array; fileName: string };

/** Everything a redaction needs, from the studio's detection state. */
export interface RedactionInput {
	/** The detection being redacted (server id, or local run id). */
	detectionId: string;
	/** The reviewer's decisions, if any (a redaction with none applies the
	 *  detected entities as the policy dictates). */
	edits?: EditSet;
	/** Local-only: the document name, bytes, policies, and audit the engine needs.
	 *  The server path ignores these — it has the stored detection. */
	name: string;
	bytes: () => Promise<Uint8Array>;
	audit: Audit;
}

/** The redaction backend the studio applies edits through. */
export interface RedactionProvider {
	/** Apply the reviewer's edits, producing the redacted output. */
	produce(input: RedactionInput): Promise<RedactionOutput>;

	/** The existing redaction output for a detection, or `null` — restored so the
	 *  panel offers the download without re-running. Local runs have none until
	 *  redacted in-session, so the local provider returns `null`. */
	findLatest(detectionId: string): Promise<RedactionOutput | null>;
}
