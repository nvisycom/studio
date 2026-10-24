import type { Nvisy } from "@nvisy/sdk";
import type { Workspace } from "@nvisy/sdk/datatypes";

/**
 * A workspace's backend origin. A local workspace is a folder on disk (desktop);
 * a server workspace lives on a Nvisy server. The distinction is a property of
 * the workspace, not the session: a signed-in desktop user can hold both, and
 * each is served by its own backend. Origin is carried on the record as a
 * local-only `folder` field (absent on server workspaces).
 */
export type WorkspaceWithOrigin = Workspace & { folder?: string };

/**
 * Whether a workspace is a local folder-workspace (vs. a server one). The SDK
 * `Workspace` type has no `folder` field (it's a local-only extra on the
 * record), so the check reads it structurally.
 */
export function isLocalWorkspace(
	workspace: Workspace | null | undefined,
): boolean {
	return !!(workspace as WorkspaceWithOrigin | null | undefined)?.folder;
}

/*
 * The repository seam: the interface the workspace-scoped composables call
 * instead of the SDK directly. It has two implementations — a `ServerRepository`
 * that wraps the SDK (web, and desktop when signed in) and a `LocalRepository`
 * that invokes the Tauri store (desktop, offline / no account). The composables,
 * the colada queries, and the UI above them never see which one is in play.
 *
 * Each sub-interface is the SDK resource's own type (`Nvisy["policies"]`, …), so
 * the SDK is the single source of truth for both the entity shapes and the
 * method signatures, and the server implementation is the client's resource
 * as-is. The local implementation satisfies the same signatures against the
 * on-device store; it holds each entity as the SDK's JSON verbatim, so the two
 * are interchangeable without a second schema. Entities are added one resource
 * at a time as each is wired to the local store.
 */

/**
 * The public method surface of an SDK resource, as a structural type.
 *
 * `Nvisy["policies"]` is the resource *class* type, which carries a private
 * field — so a plain object (the local implementation) can't satisfy it. `Pick`
 * keeps only the named public methods, giving a structural contract both the SDK
 * client and the local store can meet.
 */
type ResourceOf<T, K extends keyof T> = Pick<T, K>;

/**
 * The workspace-lifecycle seam: listing the workspaces that exist, and creating
 * / updating / deleting them. Kept SEPARATE from {@link Repository} because it
 * answers a different question — "which workspaces exist" vs "the data inside a
 * workspace" — and because it must not be per-workspace: on desktop the list is
 * a UNION of the local folder-workspaces and (when signed in) the server ones,
 * so it can't be resolved through a single per-workspace backend. Avatars (Blob
 * upload) stay server-only and are deliberately not part of the seam.
 */
export interface WorkspaceList {
	workspaces: ResourceOf<
		Nvisy["workspaces"],
		| "listWorkspaces"
		| "getWorkspace"
		| "createWorkspace"
		| "updateWorkspace"
		| "deleteWorkspace"
	>;
}

/** The SDK resources exposed through the seam. Grows one key per entity. */
export interface Repository {
	policies: ResourceOf<
		Nvisy["policies"],
		| "listPolicies"
		| "getPolicy"
		| "createPolicy"
		| "updatePolicy"
		| "deletePolicy"
		| "promotePolicy"
	>;
	// Pipelines are the detection-time policy set. On desktop they are local
	// entities (a named `{ policyIds, defaultScope }`, no triggers/schedules), so
	// the studio's pipeline picker works offline against the local store.
	pipelines: ResourceOf<
		Nvisy["pipelines"],
		| "listPipelines"
		| "getPipeline"
		| "createPipeline"
		| "updatePipeline"
		| "deletePipeline"
	>;
	// Documents. On desktop these are the files in the workspace's folder: the
	// folder holds the bytes, a local index holds the records. `downloadDocument`
	// returns a `Response` so the studio's blob-URL byte path is identical to the
	// server's; `uploadDocuments` writes the bytes into the folder. The studio and
	// documents page read/write exclusively through these, so the same UI serves
	// both backends.
	documents: ResourceOf<
		Nvisy["documents"],
		| "listDocuments"
		| "getDocument"
		| "downloadDocument"
		| "uploadDocuments"
		| "updateDocument"
		| "deleteDocument"
		| "deleteDocuments"
	>;
	// Per-workspace notification settings (which events fire a notification). The
	// SDK exposes these on its `workspaces` resource, but they're workspace-scoped
	// data, not lifecycle, so they live here. The local impl stores prefs on-device
	// (Tauri settings store) scoped to the locally-meaningful events (the pipeline
	// events — a local workspace has no member/review/connection events); the
	// server impl is the SDK as-is.
	notificationSettings: ResourceOf<
		Nvisy["workspaces"],
		"getNotificationSettings" | "updateNotificationSettings"
	>;
}
