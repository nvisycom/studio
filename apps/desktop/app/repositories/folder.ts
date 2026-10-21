import { invoke } from "@tauri-apps/api/core";
import type { Workspace } from "@nvisy/sdk/datatypes";
import { parseBody, storeGet } from "./store";

/*
 * A local workspace is a folder on disk. The SDK `Workspace` type has no folder
 * field, so the path rides as a local-only extra on the persisted body: the body
 * is opaque JSON, and `LocalWorkspace` is structurally a `Workspace` plus the
 * path, so it reads back and still satisfies the seam's `Workspace` everywhere.
 *
 * Folder access is authorized by workspace id, not by path: the Rust side binds
 * each workspace id to its folder (only one the user picked), so every FS/engine
 * command takes the `workspaceId` and never a caller-supplied folder. The path
 * stored on the record is only used to (re-)establish that binding.
 */

/** A local workspace: a `Workspace` plus the on-disk folder that backs it. */
export type LocalWorkspace = Workspace & {
	/** Absolute path to the folder whose files are this workspace's documents. */
	folder?: string;
};

/**
 * Ensure the Rust side has `workspaceId` bound to its folder, so the FS/engine
 * commands authorize by id. Reads the folder off the stored record and binds it;
 * the bind is idempotent and succeeds for a folder the user picked this session
 * or one already bound at startup (a past workspace re-seeded from Rust's own
 * persisted map). Throws if the workspace is missing or carries no folder.
 */
export async function ensureBound(workspaceId: string): Promise<void> {
	const record = await storeGet("workspaces", workspaceId);
	if (!record) throw new Error(`workspace ${workspaceId} not found`);
	const workspace = parseBody<LocalWorkspace>(record);
	if (!workspace.folder) {
		throw new Error("this local workspace has no folder");
	}
	await invoke("bind_workspace_folder", {
		workspaceId,
		folder: workspace.folder,
	});
}

/**
 * Locate a document for the engine: the workspace id plus the document's path
 * within that workspace's bound folder, resolved from its id. The engine reads
 * the file directly from (workspaceId, path), so the bytes never cross IPC and
 * one workspace can't read another's.
 */
export async function locateDocument(
	workspaceId: string,
	documentId: string,
): Promise<{ workspaceId: string; path: string }> {
	await ensureBound(workspaceId);
	const record = await storeGet("documents", documentId);
	const doc = record
		? parseBody<{ path: string; workspaceId: string }>(record)
		: null;
	// Scope to the workspace: a document id from another workspace would otherwise
	// resolve its path under THIS workspace's folder and read the wrong file.
	if (!doc || doc.workspaceId !== workspaceId) {
		throw new Error(`document ${documentId} not found`);
	}
	return { workspaceId, path: doc.path };
}
