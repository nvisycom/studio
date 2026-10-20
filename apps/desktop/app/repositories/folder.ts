import type { Workspace } from "@nvisy/sdk/datatypes";
import { parseBody, storeGet } from "./store";

/*
 * A local workspace is a folder on disk. The SDK `Workspace` type has no folder
 * field, so the path rides as a local-only extra on the persisted body: the body
 * is opaque JSON, and `LocalWorkspace` is structurally a `Workspace` plus the
 * path, so it reads back and still satisfies the seam's `Workspace` everywhere.
 */

/** A local workspace: a `Workspace` plus the on-disk folder that backs it. */
export type LocalWorkspace = Workspace & {
	/** Absolute path to the folder whose files are this workspace's documents. */
	folder?: string;
};

/**
 * Resolve the folder a workspace's documents live in, by reading its stored
 * record. Throws if the workspace is missing or carries no folder (a workspace
 * created before the folder model, or a non-local one) — the documents repo
 * needs a folder to read or write anything.
 */
export async function resolveFolder(workspaceId: string): Promise<string> {
	const record = await storeGet("workspaces", workspaceId);
	if (!record) throw new Error(`workspace ${workspaceId} not found`);
	const workspace = parseBody<LocalWorkspace>(record);
	if (!workspace.folder) {
		throw new Error("this local workspace has no folder");
	}
	return workspace.folder;
}
