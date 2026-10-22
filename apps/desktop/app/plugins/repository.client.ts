import { isTauri } from "@tauri-apps/api/core";
import type { Workspace } from "@nvisy/sdk/datatypes";
import type { DetectionProvider } from "#console/providers/types";
import type { RedactionProvider } from "#console/providers/redaction";
import type { Repository, WorkspaceList } from "#console/repositories/types";
import { isLocalWorkspace } from "#console/repositories/types";
import { createLocalDetectionProvider } from "~/providers/local";
import { createLocalRedactionProvider } from "~/providers/redaction-local";
import { createLocalRepository } from "~/repositories/local";
import { createLocalWorkspaceList } from "~/repositories/workspace-list";

/**
 * Inject the desktop seams: the workspace list (a union of local + server), and
 * the per-workspace backends (repository, detection, redaction).
 *
 * The backend is chosen PER WORKSPACE, not per session: a local folder-workspace
 * (`isLocalWorkspace`) is served by the on-device store + engine; a server
 * workspace falls through (`null`) to the seam's SDK default. So a signed-in
 * desktop user can hold both and switch between them freely. The workspace list
 * is the one union-aware seam — it merges the local store with the server (when
 * signed in) so both kinds appear in the switcher.
 *
 * `enforce: "pre"` so the resolvers are registered before any composable
 * resolves. The resolver bodies run lazily — only when a seam is read, well after
 * app init — so composables like `useAuth` (which need Pinia) are called there,
 * never at plugin setup (which runs before Pinia is installed).
 */
export default defineNuxtPlugin({
	name: "repository",
	enforce: "pre",
	setup(nuxtApp) {
		if (!isTauri()) return;

		// Built once, lazily — they hold no client, only invoke commands / the
		// store — but only when first needed, inside a resolver call.
		let repository: Repository | null = null;
		let workspaceList: WorkspaceList | null = null;

		const localRepository = () => (repository ??= createLocalRepository());

		// The one per-workspace decision, shared by all three data seams: a local
		// folder-workspace is served locally; anything else falls through to the
		// server default. `null` workspace (none active yet) → server default.
		const local = (workspace: Workspace | null) => isLocalWorkspace(workspace);

		// The resolver already receives the active workspace, so the per-workspace
		// providers take that workspace's id directly — no `useWorkspaces()` inside
		// the provider (which would register a watcher on every invocation and can
		// run outside an active Nuxt context during async work).
		const wsId = (workspace: Workspace) => () => workspace.id;

		setRepositoryResolver((workspace) =>
			local(workspace) ? localRepository() : null,
		);
		setDetectionResolver((workspace): DetectionProvider | null =>
			workspace && local(workspace)
				? createLocalDetectionProvider(localRepository(), wsId(workspace))
				: null,
		);
		setRedactionResolver((workspace): RedactionProvider | null =>
			workspace && local(workspace)
				? createLocalRedactionProvider(localRepository(), wsId(workspace))
				: null,
		);

		// The workspace list is the union: always local, plus the server's when a
		// client exists (signed in). Built once; the server half reads the client
		// off the captured `nuxtApp` (not `useNuxtApp()` after an await), so it
		// picks up a sign-in that happens after boot without needing a Nuxt context.
		workspaceList ??= createLocalWorkspaceList(() => {
			const client = nuxtApp.$nvisyClient.value;
			return client ? client.workspaces : null;
		});
		setWorkspaceListResolver(() => workspaceList);
	},
});
