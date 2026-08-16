import type {
	Audit,
	CreatePipelineRun,
	PipelineRun,
	PipelineRunsQuery,
} from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** States that settle a run — detection is ready at "analyzed", the rest end it. */
const TERMINAL: PipelineRun["status"][] = [
	"analyzed",
	"completed",
	"failed",
	"cancelled",
];

/** Runs list filter: the API's PipelineRunsQuery plus a pipeline slug, which
 * routes to the pipeline-scoped list endpoint. */
export interface RunsFilter extends PipelineRunsQuery {
	pipelineSlug?: string;
}

/**
 * Composable for pipeline run operations (workspace-scoped). Pass a reactive
 * `filter` to scope the runs list server-side (status, trigger, pipeline).
 */
export function useRuns(filter?: MaybeRefOrGetter<RunsFilter>) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();

	const activeFilter = computed<RunsFilter>(() => toValue(filter ?? {}));

	const runsQuery = workspaceQuery(
		"runs",
		async ({ client, workspaceSlug }) => {
			const { pipelineSlug, ...query } = activeFilter.value;
			// A pipeline filter uses the pipeline-scoped endpoint (the workspace
			// list only filters by pipelineId, which isn't exposed on summaries).
			const result = pipelineSlug
				? await client.runs.listPipelineRuns(workspaceSlug, pipelineSlug, query)
				: await client.runs.listRuns(workspaceSlug, query);
			return result.items;
		},
		{
			key: () => [
				"runs",
				currentWorkspaceSlug.value,
				JSON.stringify(activeFilter.value),
			],
		},
	);

	async function getRun(runId: string): Promise<PipelineRun> {
		const { client, workspaceSlug } = requireContext();
		return await client.runs.getRun(workspaceSlug, runId);
	}

	async function getDetections(runId: string): Promise<Audit> {
		const { client, workspaceSlug } = requireContext();
		return await client.runs.getDetections(workspaceSlug, runId);
	}

	/** Download a run's audit as JSON or CSV, saved under `fileName`. */
	async function downloadAudit(
		runId: string,
		format: "json" | "csv",
		fileName: string,
	): Promise<void> {
		const { client, workspaceSlug } = requireContext();
		const response =
			format === "json"
				? await client.runs.downloadAuditJson(workspaceSlug, runId)
				: await client.runs.downloadAuditCsv(workspaceSlug, runId);
		const url = URL.createObjectURL(await response.blob());
		triggerBrowserDownload(url, fileName);
	}

	/**
	 * The most recent run for a file that carries a usable audit (analyzed or
	 * completed), or null if the file has never been run to a ready state. Used
	 * to restore a file's detections when it's reopened. Ordering isn't
	 * guaranteed by the API, so we sort by `startedAt` ourselves.
	 */
	async function findLatestRunForFile(
		fileId: string,
	): Promise<PipelineRun | null> {
		const { client, workspaceSlug } = requireContext();
		const { items } = await client.runs.listRuns(workspaceSlug, {
			fileId,
			limit: 100,
		});
		return (
			items
				.filter((r) => r.status === "analyzed" || r.status === "completed")
				.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0] ?? null
		);
	}

	/**
	 * Stream a run's status changes over SSE until it settles, then return the
	 * final status. Yields the current status first, then each transition.
	 * `onStatus` reports every tick so the UI can show live progress.
	 */
	async function waitForRun(
		runId: string,
		onStatus?: (status: PipelineRun["status"]) => void,
	): Promise<PipelineRun["status"]> {
		const { client, workspaceSlug } = requireContext();
		let last: PipelineRun["status"] | null = null;
		for await (const event of client.runs.streamEvents(workspaceSlug, runId)) {
			last = event.status;
			onStatus?.(event.status);
			if (TERMINAL.includes(event.status)) break;
		}
		if (!last) throw new Error("The run stream closed before any status.");
		return last;
	}

	/**
	 * Run detection end-to-end: create a run for `fileId` on `pipelineSlug`,
	 * stream its status until it analyzes, then fetch its audit. `onStatus`
	 * reports each transition. Throws if the run fails/cancels.
	 */
	async function runDetection(
		pipelineSlug: string,
		body: CreatePipelineRun,
		onStatus?: (status: PipelineRun["status"]) => void,
	): Promise<{ audit: Audit }> {
		const { client, workspaceSlug } = requireContext();
		const created = await client.runs.createRun(
			workspaceSlug,
			pipelineSlug,
			body,
		);
		onStatus?.(created.status);

		const status = TERMINAL.includes(created.status)
			? created.status
			: await waitForRun(created.id, onStatus);

		if (status === "failed" || status === "cancelled") {
			throw new Error(`Run ${status}.`);
		}

		const audit = await getDetections(created.id);
		return { audit };
	}

	return {
		// Query state
		runs: runsQuery.data,
		isLoading: runsQuery.isLoading,
		error: runsQuery.error,
		refresh: runsQuery.refresh,

		// Single run + detection flow
		getRun,
		getDetections,
		downloadAudit,
		findLatestRunForFile,
		runDetection,
	};
}
