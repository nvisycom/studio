import { invoke } from "@tauri-apps/api/core";
import type {
	AccountRef,
	CreateWorkspace,
	CursorPagination,
	UpdateWorkspace,
	Workspace,
	WorkspacePage,
	WorkspaceSettings,
} from "@nvisy/sdk/datatypes";
import type { WorkspaceList } from "#console/repositories/types";
import type { LocalWorkspace } from "./folder";
import {
	type Collection,
	parseBody,
	type StoreRecord,
	storeDelete,
	storeGet,
	storeList,
	storeUpsert,
} from "./store";

/** The collections whose rows belong to a workspace and are cleared with it. */
const WORKSPACE_SCOPED: Collection[] = [
	"documents",
	"policies",
	"pipelines",
	"detections",
	"redactions",
	"scopes",
	"matchers",
	"labels",
];

/*
 * The workspaces resource of the local store. A local workspace is a real
 * workspace with a local id (so the existing `/w/[workspace]` routing works
 * unchanged), persisted as its full `Workspace` JSON. It carries a local author
 * and owner role, since there is no account offline.
 */

/** The author stamped on locally-created entities: no real account exists. */
const LOCAL_AUTHOR: AccountRef = { id: "local", username: "local" };

/** The settings a local workspace starts with (the SDK's own defaults). */
const DEFAULT_SETTINGS: WorkspaceSettings = { raster: "auto" };

/** A URL-safe handle derived from a display name (lowercase, dashed). */
function toHandle(displayName: string): string {
	const base = displayName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	// Keep handles unique and non-empty even for odd names.
	return `${base || "workspace"}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Wrap a workspace as the store record to persist. */
function toRecord(workspace: Workspace): StoreRecord {
	return {
		id: workspace.id,
		workspaceId: null,
		name: workspace.displayName,
		kind: null,
		updatedAt: workspace.updatedAt,
		body: JSON.stringify(workspace),
	};
}

/** The local store's workspaces resource. */
export function createWorkspacesRepository(): WorkspaceList["workspaces"] {
	async function getWorkspace(workspaceId: string): Promise<Workspace> {
		const record = await storeGet("workspaces", workspaceId);
		if (!record) throw new Error(`workspace ${workspaceId} not found`);
		return parseBody<Workspace>(record);
	}

	async function upsert(workspace: Workspace): Promise<Workspace> {
		await storeUpsert("workspaces", toRecord(workspace));
		return workspace;
	}

	return {
		listWorkspaces: async (
			query?: CursorPagination,
		): Promise<WorkspacePage> => {
			const page = await storeList("workspaces", {
				after: query?.after,
				limit: query?.limit,
			});
			return {
				items: page.items.map((r) => parseBody<Workspace>(r)),
				nextCursor: page.nextCursor,
			};
		},

		getWorkspace,

		createWorkspace: async (draft: CreateWorkspace): Promise<Workspace> => {
			// A local workspace IS a folder — a folder-less one is nonsensical (it
			// would show up mislabeled as a server workspace and have no documents),
			// so require the folder the onboarding/create flow is meant to pass. This
			// guards the invariant: everything in the local store has a folder.
			const folder = (draft as CreateWorkspace & { folder?: string }).folder;
			if (!folder) {
				throw new Error(
					"a local workspace requires a folder; use the server backend for a folder-less workspace",
				);
			}
			const now = new Date().toISOString();
			const workspace: LocalWorkspace = {
				id: crypto.randomUUID(),
				displayName: draft.displayName,
				description: draft.description,
				handle: draft.handle ?? toHandle(draft.displayName),
				settings: draft.settings ?? DEFAULT_SETTINGS,
				memberRole: "owner",
				createdBy: LOCAL_AUTHOR,
				createdAt: now,
				updatedAt: now,
				folder,
			};
			// Bind the id to its folder in Rust before persisting the record, so
			// every later FS/engine command authorizes by id. The folder was just
			// picked this session, so the bind is allowed.
			await invoke("bind_workspace_folder", {
				workspaceId: workspace.id,
				folder,
			});
			return upsert(workspace);
		},

		updateWorkspace: async (
			workspaceId: string,
			updates: UpdateWorkspace,
		): Promise<Workspace> => {
			const current = await getWorkspace(workspaceId);
			const next: Workspace = {
				...current,
				displayName: updates.displayName ?? current.displayName,
				description: updates.description ?? current.description,
				settings: updates.settings ?? current.settings,
				updatedAt: new Date().toISOString(),
			};
			return upsert(next);
		},

		deleteWorkspace: async (workspaceId: string): Promise<void> => {
			// Delete the workspace's child records first, then the workspace itself.
			// A detection body holds a full `Audit` (the detected sensitive values),
			// so leaving them behind would strand PII on disk with no UI to remove
			// it. Every workspace-scoped collection is cleared.
			for (const collection of WORKSPACE_SCOPED) {
				let after: string | undefined;
				do {
					const page = await storeList(collection, { workspaceId, after });
					for (const record of page.items) {
						await storeDelete(collection, record.id);
					}
					after = page.nextCursor;
				} while (after);
			}
			await storeDelete("workspaces", workspaceId);
			// Drop the folder binding too, so Rust's persisted map doesn't keep the
			// deleted workspace's folder.
			await invoke("unbind_workspace_folder", { workspaceId });
		},
	};
}
