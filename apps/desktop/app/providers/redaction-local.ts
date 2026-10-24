import { invoke } from "@tauri-apps/api/core";
import type { Policy, WorkspacePolicy } from "@nvisy/sdk/datatypes";
import type {
	RedactionInput,
	RedactionOutput,
	RedactionProvider,
} from "#console/providers/redaction";
import type { Repository } from "#console/repositories/types";
import { locateDocument } from "~/repositories/folder";
import { getRun } from "~/repositories/runs";

/*
 * The local, engine-backed redaction provider: applies the reviewer's edits to a
 * local run's audit in-process. The engine reads the input from disk and writes
 * the redacted output as a sibling in the workspace folder (so it becomes a
 * persisted `redacted` document), returning its path; this provider reads that
 * output back for the studio's download. Desktop-only; injected by the plugin.
 */

/** The output the engine's `redact` command writes and returns. */
interface Redacted {
	name: string;
	path: string;
}

/** Resolve the policy definitions the redaction's run was detected with. The run
 *  records the policy ids it ran against, so redaction uses the same set. */
async function policiesForRun(
	repository: Repository,
	workspaceId: () => string,
	detectionId: string,
): Promise<Policy[]> {
	const run = await getRun(detectionId);
	if (!run) throw new Error(`local run ${detectionId} not found`);
	const ws = workspaceId();
	const policies = await Promise.all(
		run.policyIds.map((id) => repository.policies.getPolicy(ws, id)),
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
			const ws = workspaceId();
			const run = await getRun(input.detectionId);
			if (!run) throw new Error(`local run ${input.detectionId} not found`);
			const policies = await policiesForRun(
				repository,
				workspaceId,
				input.detectionId,
			);
			// The input document is on disk; the engine reads it by (workspaceId,
			// path), redacts, and writes the sibling output itself — no bytes cross
			// IPC. The run records which document it was.
			const document = await locateDocument(ws, run.fileId);
			const redacted = await invoke<Redacted>("redact", {
				document,
				policies,
				audit: input.audit,
				edits: input.edits,
			});

			// Read the written output back for the studio's download (a raw response;
			// number[] on the WebKitGTK fallback).
			const raw = await invoke<ArrayBuffer | number[]>("documents_read", {
				workspaceId: ws,
				path: redacted.path,
			});
			// `new Uint8Array` accepts both an ArrayBuffer and a number[] (the
			// WebKitGTK fallback), so one call covers both.
			const bytes = new Uint8Array(raw);

			return { kind: "local", bytes, fileName: redacted.name };
		},

		// A local run has no persisted redaction output to restore — redaction is
		// produced in-session and saved immediately.
		findLatest(): Promise<RedactionOutput | null> {
			return Promise.resolve(null);
		},
	};
}
