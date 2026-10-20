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
	// No registration step: the Rust side allows only folders the user picked
	// (persisted by the pick command, re-seeded at startup), so a folder that was
	// picked for this workspace is already allowed. The webview cannot widen the
	// set — a folder we never picked simply won't resolve on the next FS command.
	return workspace.folder;
}

/**
 * Locate a document on disk: the workspace folder plus the document's path
 * within it, resolved from its id. The engine reads the file directly from this
 * (folder, path), so the bytes never cross IPC.
 */
export async function locateDocument(
	workspaceId: string,
	documentId: string,
): Promise<{ folder: string; path: string }> {
	const folder = await resolveFolder(workspaceId);
	const record = await storeGet("documents", documentId);
	if (!record) throw new Error(`document ${documentId} not found`);
	const path = parseBody<{ path: string }>(record).path;
	return { folder, path };
}
