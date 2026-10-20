import type {
	CreateWorkspace,
	UpdateWorkspace,
	Workspace,
	WorkspacePage,
} from "@nvisy/sdk/datatypes";
import {
	isLocalWorkspace,
	type WorkspaceList,
} from "#console/repositories/types";
import { createWorkspacesRepository } from "./workspaces";

/*
 * The desktop workspace-list seam: a UNION of local folder-workspaces (always,
 * from the on-device store) and the server's workspaces (when signed in). This
 * is why workspace listing is separate from the per-workspace repository — a
 * folder-workspace and a synced server workspace coexist in one list, and the
 * user switches between them freely.
 *
 * Single-item operations route by origin: a local workspace (it has a `folder`)
 * goes to the store, a server one to the SDK. Creating a folder-workspace is
 * local (the onboarding passes a `folder`); creating a plain workspace is a
 * server op when signed in.
 */

/** The server workspaces resource, present only when signed in. */
type ServerWorkspaces = WorkspaceList["workspaces"] | null;

/** Build the desktop union workspace-list over the local store + the server. */
export function createLocalWorkspaceList(
	server: () => ServerWorkspaces,
): WorkspaceList {
	const local = createWorkspacesRepository();

	/** Whether the store holds a workspace by this id (a local one). */
	async function isLocalId(workspaceId: string): Promise<boolean> {
		try {
			await local.getWorkspace(workspaceId);
			return true;
		} catch {
			return false;
		}
	}

	return {
		workspaces: {
			listWorkspaces: async (query): Promise<WorkspacePage> => {
				// Local workspaces always; server workspaces when signed in. The two
				// id spaces don't collide (local ids are random UUIDs), so a plain
				// concat is the union. Paging is a single page at a single user's
				// scale (the local store caps at 1000; the server honors its cursor).
				const localPage = await local.listWorkspaces(query);
				// Defensive: a local-store workspace MUST have a folder (that's what
				// makes it local). Skip any folder-less entry — it would otherwise
				// show up mislabeled as a server workspace. `createWorkspace` now
				// guards against making one, but older data may exist.
				const localItems = localPage.items.filter((w) => isLocalWorkspace(w));
				const srv = server();
				if (!srv) return { ...localPage, items: localItems };
				const serverPage = await srv.listWorkspaces(query);
				return {
					items: [...localItems, ...serverPage.items],
					// No merged cursor: both sides are listed in full here. A combined
					// keyset would be needed only past the per-side caps.
					nextCursor: undefined,
				};
			},

			getWorkspace: async (workspaceId: string): Promise<Workspace> => {
				if (await isLocalId(workspaceId)) {
					return local.getWorkspace(workspaceId);
				}
				const srv = server();
				if (!srv) throw new Error(`workspace ${workspaceId} not found`);
				return srv.getWorkspace(workspaceId);
			},

			createWorkspace: async (draft: CreateWorkspace): Promise<Workspace> => {
				// A folder on the draft marks a local workspace; otherwise it's a
				// server create (and requires a session).
				const folder = (draft as CreateWorkspace & { folder?: string }).folder;
				if (folder) return local.createWorkspace(draft);
				const srv = server();
				if (!srv) throw new Error("Sign in to create a server workspace.");
				return srv.createWorkspace(draft);
			},

			updateWorkspace: async (
				workspaceId: string,
				updates: UpdateWorkspace,
			): Promise<Workspace> => {
				if (await isLocalId(workspaceId)) {
					return local.updateWorkspace(workspaceId, updates);
				}
				const srv = server();
				if (!srv) throw new Error(`workspace ${workspaceId} not found`);
				return srv.updateWorkspace(workspaceId, updates);
			},

			deleteWorkspace: async (workspaceId: string): Promise<void> => {
				if (await isLocalId(workspaceId)) {
					return local.deleteWorkspace(workspaceId);
				}
				const srv = server();
				if (!srv) throw new Error(`workspace ${workspaceId} not found`);
				return srv.deleteWorkspace(workspaceId);
			},
		},
	};
}

/** Re-exported so callers can tag a workspace's origin for the UI. */
export { isLocalWorkspace };
