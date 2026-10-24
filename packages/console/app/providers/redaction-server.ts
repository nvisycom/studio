import type { Nvisy } from "@nvisy/sdk";
import type {
	RedactionInput,
	RedactionOutput,
	RedactionProvider,
} from "./redaction";

/*
 * The server-backed redaction provider: applies the reviewer's edits to a stored
 * detection and returns the output document's id. The studio downloads it via the
 * documents endpoint.
 */

/** A download name for a redaction of `fileName`, e.g. `report.redacted.pdf` —
 *  the same `.redacted.` convention the on-device path uses. */
function redactedName(fileName: string): string {
	const dot = fileName.lastIndexOf(".");
	return dot > 0
		? `${fileName.slice(0, dot)}.redacted${fileName.slice(dot)}`
		: `${fileName}.redacted`;
}

/** Build a server-backed redaction provider over an SDK client + workspace. */
export function createServerRedactionProvider(
	client: Nvisy,
	workspaceId: () => string,
): RedactionProvider {
	return {
		async produce(input: RedactionInput): Promise<RedactionOutput> {
			const ws = workspaceId();
			// 0.62: reviewer edits are persisted on the detection (optimistic-locked
			// by `editSetRev`) and layered at redact time, rather than passed to the
			// redact call. Set the edits we have — which also clears any stale ones
			// when the reviewer made none — then redact.
			const detection = await client.detections.getDetection(
				ws,
				input.detectionId,
			);
			await client.detections.editDetection(ws, input.detectionId, {
				editSetRev: detection.editSetRev,
				edits: input.edits,
			});
			const result = await client.detections.createRedaction(
				ws,
				input.detectionId,
			);
			if (!result.outputDocumentId)
				throw new Error("The redaction produced no output file.");
			return {
				kind: "server",
				fileId: result.outputDocumentId,
				fileName: redactedName(input.name),
			};
		},

		async findLatest(
			detectionId: string,
			sourceName?: string,
		): Promise<RedactionOutput | null> {
			const { items } = await client.detections.listRedactions(
				workspaceId(),
				detectionId,
				{ limit: 1 },
			);
			const latest = items[0];
			if (!latest?.outputDocumentId) return null;
			return {
				kind: "server",
				fileId: latest.outputDocumentId,
				// Name after the source document so the download has a real name and
				// extension — the output id is opaque and has neither.
				fileName: sourceName ? redactedName(sourceName) : "redacted",
			};
		},
	};
}
