import type { Ref } from "vue";
import type { Workspace } from "@nvisy/sdk/datatypes";
import { createServerRepository } from "#console/repositories/server";
import type { Repository } from "#console/repositories/types";

/**
 * The repository seam: where a composable gets its data, resolved to a backend
 * for the ACTIVE WORKSPACE.
 *
 * By default, and always on the web, this is the server-backed repository built
 * from the live SDK client. The desktop app injects a resolver (via
 * `setRepositoryResolver`) that returns a local store-backed repository for a
 * local folder-workspace and `null` (fall through to server) for a server one.
 * The choice is per workspace, not per session — a signed-in desktop user holds
 * both kinds at once. The layer stays free of any Tauri dependency; the desktop
 * fills the seam in, exactly as `useApiFetch` does for the SDK's transport.
 */

/**
 * Resolves the repository for a workspace, or `null` to fall through to the
 * server default. The desktop override decides from the workspace's origin.
 */
type Resolver = (workspace: Workspace | null) => Repository | null;

// Module-level so the injected resolver is shared across every consumer.
const injected = ref<Resolver | null>(null);

/**
 * Inject the repository resolver (desktop: local for a folder-workspace, server
 * otherwise). Called once from a desktop-only plugin at boot.
 */
export function setRepositoryResolver(resolver: Resolver | null) {
	injected.value = resolver;
}

export function useRepository(): {
	/**
	 * The active repository, or `null` when none is available yet (no session
	 * and no local backend — the web app before sign-in).
	 */
	repository: Ref<Repository | null>;
} {
	const { $nvisyClient } = useNuxtApp();
	const { currentWorkspace } = useWorkspaces();

	const repository = computed<Repository | null>(() => {
		// The desktop override picks local-vs-server from the active workspace.
		if (injected.value) {
			const local = injected.value(currentWorkspace.value);
			if (local) return local;
		}
		// Default (web, and desktop's server workspaces): the SDK client, or null
		// when there is no client (logged out, web).
		const client = $nvisyClient.value;
		return client ? createServerRepository(client) : null;
	});

	return { repository };
}
