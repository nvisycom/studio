import type { Ref } from "vue";
import type { Workspace } from "@nvisy/sdk/datatypes";
import type { RedactionProvider } from "#console/providers/redaction";
import { createServerRedactionProvider } from "#console/providers/redaction-server";

/**
 * The redaction seam: where the studio applies reviewer edits, resolved to a
 * backend for the ACTIVE WORKSPACE. Default (and web) = the server redaction
 * flow; the desktop app injects the local engine-backed provider for a local
 * folder-workspace. Same per-workspace idiom as `useDetectionProvider`.
 */

type Resolver = (workspace: Workspace | null) => RedactionProvider | null;

const injected = ref<Resolver | null>(null);

/** Inject the redaction-provider resolver (desktop plugin, at boot). */
export function setRedactionResolver(resolver: Resolver | null) {
	injected.value = resolver;
}

export function useRedactionProvider(): {
	provider: Ref<RedactionProvider | null>;
} {
	const { $nvisyClient } = useNuxtApp();
	const { currentWorkspace, currentWorkspaceId } = useWorkspaces();

	const provider = computed<RedactionProvider | null>(() => {
		if (injected.value) {
			const local = injected.value(currentWorkspace.value);
			if (local) return local;
		}
		const client = $nvisyClient.value;
		if (!client) return null;
		return createServerRedactionProvider(client, () => {
			const id = currentWorkspaceId.value;
			if (!id) throw new Error("No workspace selected");
			return id;
		});
	});

	return { provider };
}
