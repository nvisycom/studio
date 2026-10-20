import { invoke } from "@tauri-apps/api/core";
import type { Policy, WorkspacePolicy } from "@nvisy/sdk/datatypes";
import type {
	RedactionInput,
	RedactionOutput,
	RedactionProvider,
} from "#console/detection/redaction";
import type { Repository } from "#console/repositories/types";
import { resolveFolder } from "~/repositories/folder";
import { getRun } from "~/repositories/runs";

/*
 * The local, engine-backed redaction provider: applies the reviewer's edits to a
 * local run's audit in-process and returns the redacted bytes directly (no output
 * file id). The studio saves them via the native file bridge. Desktop-only;
 * injected into the redaction seam by the desktop plugin.
 */

/** The redacted bytes the engine's `redact` command returns. */
interface Redacted {
	name: string;
	bytes: number[];
}

/** Resolve the policy definitions the redaction's run was detected with. */
async function policiesForRun(
	repository: Repository,
	workspaceId: () => string,
	detectionId: string,
): Promise<Policy[]> {
	const run = await getRun(detectionId);
	if (!run) throw new Error(`local run ${detectionId} not found`);
	const ws = workspaceId();
	const pipeline = await repository.pipelines.getPipeline(ws, run.pipelineId);
	const ids = pipeline.definition.policyIds ?? [];
	const policies = await Promise.all(
		ids.map((id) => repository.policies.getPolicy(ws, id)),
	);
	return policies.map((p: WorkspacePolicy) => p.definition);
}

/** Build the local, engine-backed redaction provider. */
export function createLocalRedactionProvider(
	repository: Repository,
	workspaceId: () => string,
): RedactionProvider {
	return {
		async produce(input: RedactionInput): Promise<RedactionOutput> {
			const policies = await policiesForRun(
				repository,
				workspaceId,
				input.detectionId,
			);
			const bytes = await input.bytes();
			const redacted = await invoke<Redacted>("redact", {
				name: input.name,
				bytes: Array.from(bytes),
				policies,
				audit: input.audit,
				edits: input.edits,
			});

			// Write the output back into the workspace folder as a sibling, so it
			// becomes a persisted `redacted` document (the next list reconcile
			// classifies a `.redacted.` name as redacted). Best-effort: if the folder
			// write fails, the studio still saves the bytes via the native panel.
			try {
				const folder = await resolveFolder(workspaceId());
				await invoke("documents_write", {
					folder,
					path: redacted.name,
					data: redacted.bytes,
				});
			} catch (error) {
				console.warn("Could not write redaction into the folder:", error);
			}

			return {
				kind: "local",
				bytes: new Uint8Array(redacted.bytes),
				fileName: redacted.name,
			};
		},

		// A local run has no persisted redaction output to restore — redaction is
		// produced in-session and saved immediately.
		findLatest(): Promise<RedactionOutput | null> {
			return Promise.resolve(null);
		},
	};
}
