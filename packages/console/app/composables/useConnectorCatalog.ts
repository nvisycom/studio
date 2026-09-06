import type { ConnectorCatalog } from "@nvisy/sdk/datatypes";
import type { FileProvider } from "#console/utils/connections";
import { FILE_PROVIDER_CATALOG_KEY } from "#console/utils/connections";

/**
 * Which connector families and providers this deployment can actually create,
 * sourced from `GET /catalog/connectors/`.
 *
 * The catalog is the server's answer to "what can be connected here": object
 * stores and inference (LLM) connections carry their own credentials and are
 * always available, while an OAuth file-service provider (Google Drive,
 * Dropbox, OneDrive, Box) is offered only when its OAuth app is configured on
 * the deployment. The explore page reads this instead of hardcoding
 * availability, so a provider without a configured OAuth app shows as
 * unavailable rather than a dead Connect button.
 *
 * Deployment-scoped and effectively static within a session, so it's fetched
 * once and cached (`staleTime: Infinity`); call `refresh()` after a known
 * server-side change.
 */
export function useConnectorCatalog() {
	const { $nvisyClient } = useNuxtApp();
	const { authToken } = useAuth();

	const query = useQuery<ConnectorCatalog>({
		key: ["catalog", "connectors"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) throw new Error("Not authenticated");
			return await client.catalog.listConnectors();
		},
		enabled: () => !!authToken.value?.apiToken,
		// Deployment configuration, not per-request data; don't auto-refetch.
		staleTime: Number.POSITIVE_INFINITY,
	});

	const catalog = computed<ConnectorCatalog | undefined>(
		() => query.data.value,
	);

	// Object-store and inference connections are always creatable; only the
	// per-family flags gate them. Until the catalog loads, treat the always-on
	// families as available (they never depend on server OAuth config) and
	// file-services as unavailable (they do), so the UI never shows a Connect
	// button that can't work.
	const objectStoresAvailable = computed(
		() => catalog.value?.objectStores ?? true,
	);
	const inferenceAvailable = computed(() => catalog.value?.inference ?? true);

	/** Whether a specific OAuth file-service provider can be connected here. */
	function fileServiceAvailable(provider: FileProvider): boolean {
		const flags = catalog.value?.fileServices;
		if (!flags) return false;
		return flags[FILE_PROVIDER_CATALOG_KEY[provider]] ?? false;
	}

	return {
		catalog,
		objectStoresAvailable,
		inferenceAvailable,
		fileServiceAvailable,
		isLoading: query.isLoading,
		error: query.error,
		refresh: query.refresh,
	};
}
