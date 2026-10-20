import type { Ref } from "vue";
import type { WorkspaceList } from "#console/repositories/types";

/**
 * The workspace-lifecycle seam: which workspaces exist, and creating / updating
 * / deleting them. Separate from {@link useRepository} (the per-workspace data
 * backend) because listing workspaces can't be per-workspace — on desktop the
 * list is a union of local folder-workspaces and the server's, so it has its own
 * resolution path. Splitting it also breaks the cycle that would otherwise exist
 * (the per-workspace repository needs the active workspace, which comes from the
 * list).
 *
 * Default (web, and the server half of desktop): the SDK client. The desktop
 * app injects a resolver (via `setWorkspaceListResolver`) that returns a
 * union-aware list over the local store plus the server.
 */

/** Resolves the workspace-lifecycle backend, or `null` to use the server. */
type Resolver = () => WorkspaceList | null;

const injected = ref<Resolver | null>(null);

/** Inject the workspace-list resolver (desktop union). Called once at boot. */
export function setWorkspaceListResolver(resolver: Resolver | null) {
	injected.value = resolver;
}

export function useWorkspaceList(): {
	/** The workspace-lifecycle backend, or `null` when none is available yet. */
	list: Ref<WorkspaceList | null>;
} {
	const { $nvisyClient } = useNuxtApp();

	const list = computed<WorkspaceList | null>(() => {
		if (injected.value) {
			const injectedList = injected.value();
			if (injectedList) return injectedList;
		}
		const client = $nvisyClient.value;
		// The SDK client's `workspaces` resource is exactly the `WorkspaceList`
		// surface.
		return client ? { workspaces: client.workspaces } : null;
	});

	return { list };
}
