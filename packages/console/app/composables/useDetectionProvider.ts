import type { Ref } from "vue";
import type { Workspace } from "@nvisy/sdk/datatypes";
import { createServerDetectionProvider } from "#console/providers/server";
import type { DetectionProvider } from "#console/providers/types";

/**
 * The detection seam: where the studio runs a detection, resolved to a backend
 * for the ACTIVE WORKSPACE.
 *
 * By default, and always on the web, this is the server-backed provider (the
 * pipeline flow). The desktop app injects a resolver (via `setDetectionResolver`)
 * that returns the local engine-backed provider for a local folder-workspace and
 * `null` (fall through to server) for a server one — the same per-workspace
 * idiom as `useRepository`. The layer stays free of any Tauri dependency; the
 * desktop fills it in.
 */

/** Resolves the detection provider for a workspace, or `null` for the server. */
type Resolver = (workspace: Workspace | null) => DetectionProvider | null;

// Module-level so the injected resolver is shared across every consumer.
const injected = ref<Resolver | null>(null);

/**
 * Inject the detection-provider resolver (desktop: local when logged out, server
 * when signed in). Called once from a desktop-only plugin at boot.
 */
export function setDetectionResolver(resolver: Resolver | null) {
	injected.value = resolver;
}

export function useDetectionProvider(): {
	/** The active detection provider, or `null` when none is available. */
	provider: Ref<DetectionProvider | null>;
} {
	const { $nvisyClient } = useNuxtApp();
	const { currentWorkspace, currentWorkspaceId } = useWorkspaces();

	const provider = computed<DetectionProvider | null>(() => {
		// The desktop override picks the local engine for a folder-workspace.
		if (injected.value) {
			const local = injected.value(currentWorkspace.value);
			if (local) return local;
		}
		const client = $nvisyClient.value;
		if (!client) return null;
		// The server provider resolves the active workspace per call.
		return createServerDetectionProvider(client, () => {
			const id = currentWorkspaceId.value;
			if (!id) throw new Error("No workspace selected");
			return id;
		});
	});

	return { provider };
}
