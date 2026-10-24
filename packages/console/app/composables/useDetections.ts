import { NvisyApiError } from "@nvisy/sdk";
import type {
	ArtifactSet,
	Audit,
	WorkspaceDetection,
	WorkspaceDetectionsQuery,
} from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** Detections list filter: the API's query (status, document, policy). */
export type DetectionsFilter = WorkspaceDetectionsQuery;

/**
 * Composable for detection operations (workspace-scoped). Pass a reactive
 * `filter` to scope the detections list server-side (status, document, policy).
 */
export function useDetections(filter?: MaybeRefOrGetter<DetectionsFilter>) {
	const { requireContext, enabled, currentWorkspaceId } = useWorkspaceContext();
	const { saveBlob } = useFileDownload();
	const { provider } = useDetectionProvider();

	const activeFilter = computed<DetectionsFilter>(() => toValue(filter ?? {}));

	// When the active provider exposes a local history (desktop, offline), the
	// detections list and analysis come from the on-device runs rather than the
	// SDK. The server path is unchanged — its provider leaves `list`/`getAnalysis`
	// unset, so this stays null and the query falls through to the SDK.
	const localList = computed(() => provider.value?.list ?? null);
	const localAnalysis = computed(() => provider.value?.getAnalysis ?? null);

	// Not `workspaceQuery`: the local branch must run with no client, but
	// `workspaceQuery` resolves `requireContext()` (which throws offline) before
	// the body. So the client context is resolved only inside the server branch.
	const detectionsQuery = useQuery<WorkspaceDetection[]>({
		key: () => [
			"detections",
			currentWorkspaceId.value,
			JSON.stringify(activeFilter.value),
		],
		enabled,
		query: async () => {
			// Local history: list the on-device runs. Status filters don't apply
			// (every local run is a complete, user-triggered run), but the file
			// filter still narrows the list client-side.
			if (localList.value) {
				const { documentId } = activeFilter.value;
				let runs = await localList.value(currentWorkspaceId.value ?? "");
				if (documentId)
					runs = runs.filter((r) => r.inputDocumentId === documentId);
				return runs;
			}

			const { client, workspaceId } = requireContext();
			const result = await client.detections.listDetections(
				workspaceId,
				activeFilter.value,
			);
			return result.items;
		},
	});

	/** Fetch a detection's analysis (the audit — detected entities + provenance).
	 *  Offline, the run's stored audit is returned through the provider. */
	async function getAnalysis(detectionId: string): Promise<Audit> {
		if (localAnalysis.value) return await localAnalysis.value(detectionId);
		const { client, workspaceId } = requireContext();
		return await client.detections.getAnalysis(workspaceId, detectionId);
	}

	/**
	 * Fetch a detection's enrichment intermediates — the artifacts a recognizer
	 * produced on the way to entities (an image's OCR layout, an audio clip's
	 * transcript, tokenized text). Optional by nature: a detection whose analysis
	 * ran no enricher has none and the endpoint 404s, which we map to `null` rather
	 * than surfacing an error — callers treat "no intermediates" as an empty state.
	 */
	async function getIntermediates(
		detectionId: string,
	): Promise<ArtifactSet | null> {
		const { client, workspaceId } = requireContext();
		try {
			return await client.detections.getIntermediates(workspaceId, detectionId);
		} catch (error) {
			if (error instanceof NvisyApiError && error.statusCode === 404) {
				return null;
			}
			throw error;
		}
	}

	/**
	 * Download a detection's audit as JSON or CSV, saved under `fileName`.
	 *
	 * Offline, the audit is serialized from the stored run. Only JSON is produced
	 * locally — the CSV export is a server-rendered multi-file zip with no
	 * on-device equivalent — so a local CSV request falls back to JSON (the caller
	 * names the file; the JSON path is what's saved).
	 */
	async function downloadAudit(
		detectionId: string,
		format: "json" | "csv",
		fileName: string,
	): Promise<void> {
		if (localAnalysis.value) {
			const audit = await localAnalysis.value(detectionId);
			const json = JSON.stringify(audit, null, 2);
			const name = fileName.replace(/\.(zip|csv)$/, ".json");
			await saveBlob(new Blob([json], { type: "application/json" }), name);
			return;
		}
		const { client, workspaceId } = requireContext();
		const response = await client.detections.downloadAudit(
			workspaceId,
			detectionId,
			{ format },
		);
		await saveBlob(await response.blob(), fileName);
	}

	return {
		// Query state
		detections: detectionsQuery.data,
		isLoading: detectionsQuery.isLoading,
		error: detectionsQuery.error,
		refresh: detectionsQuery.refresh,

		// Single detection + analysis flow
		getAnalysis,
		getIntermediates,
		downloadAudit,
	};
}
