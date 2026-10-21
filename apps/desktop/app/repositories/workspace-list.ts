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
			listWorkspaces: async (_query): Promise<WorkspacePage> => {
				// The union of two independently-paginated sources can't share one
				// cursor, so this returns the COMPLETE union in a single page (no
				// cursor) — it walks each source to the end itself. The incoming
				// `after` is ignored for the same reason (it couldn't belong to both).
				// Fine at a single user's scale.
				const localItems: Workspace[] = [];
				let after: string | undefined;
				do {
					const page = await local.listWorkspaces({ after });
					// Defensive: a local-store workspace MUST have a folder (that's what
					// makes it local). Skip any folder-less entry — it would otherwise
					// show up mislabeled as a server workspace.
					localItems.push(...page.items.filter((w) => isLocalWorkspace(w)));
					after = page.nextCursor;
				} while (after);

				const srv = server();
				if (!srv) return { items: localItems, nextCursor: undefined };

				const serverItems: Workspace[] = [];
				after = undefined;
				do {
					const page = await srv.listWorkspaces({ after });
					serverItems.push(...page.items);
					after = page.nextCursor;
				} while (after);

				return {
					items: [...localItems, ...serverItems],
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
