import type { ActivityType } from "@nvisy/sdk/datatypes";
import type { MaybeRefOrGetter } from "vue";

/** Server-side filters for the activity log (all optional). */
export interface ActivityFilters {
	/** Keep only these activity types; omit for no type constraint. */
	type?: ActivityType[];
	/** Inclusive date range, `YYYY-MM-DD` (UTC). */
	from?: string;
	to?: string;
}

/**
 * Workspace activity log, backed by `activities.listActivities`. A cursor-
 * paginated, reverse-chronological audit trail (member/file/connection/webhook/
 * invite/workspace events) with a human-readable description and the account
 * that performed each action. Powers the overview's "Recent activity" feed and
 * the analytics logs page.
 *
 * `filters` (reactive) narrows the log server-side by type and/or date range;
 * changing it refetches from the first page (pagination resets automatically).
 */
export function useActivities(options?: {
	pageSize?: number;
	filters?: MaybeRefOrGetter<ActivityFilters>;
}) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();
	const pageSize = options?.pageSize ?? 20;

	const filters = () => toValue(options?.filters) ?? {};

	// Build the SDK query from the current filters + a cursor. `type` is only sent
	// when non-empty so "all types" stays unconstrained.
	function buildQuery(after?: string) {
		const f = filters();
		return {
			limit: pageSize,
			...(after ? { after } : {}),
			...(f.type?.length ? { type: f.type } : {}),
			...(f.from ? { from: f.from } : {}),
			...(f.to ? { to: f.to } : {}),
		};
	}

	// A stable key segment for the filters, so a change refetches the base query.
	const filterKey = () => {
		const f = filters();
		return `${(f.type ?? []).join(",")}|${f.from ?? ""}|${f.to ?? ""}`;
	};

	const activitiesQuery = workspaceQuery(
		"activities",
		({ client, workspaceSlug }) =>
			client.activities.listActivities(workspaceSlug, buildQuery()),
		{
			key: () => ["activities", currentWorkspaceSlug.value, filterKey()],
		},
	);

	const {
		items: activities,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(activitiesQuery.data, (after) => {
		const { client, workspaceSlug } = requireContext();
		return client.activities.listActivities(workspaceSlug, buildQuery(after));
	});

	/**
	 * Download the activity log as CSV or JSON, saved under `fileName`. The
	 * optional date range is inclusive, `YYYY-MM-DD` (UTC); omit it to use the
	 * SDK's default window.
	 */
	async function exportActivities(
		fileName: string,
		exportOptions: { format: "csv" | "json"; from?: string; to?: string },
	): Promise<void> {
		const { client, workspaceSlug } = requireContext();
		const response = await client.activities.exportActivities(workspaceSlug, {
			format: exportOptions.format,
			...(exportOptions.from && { from: exportOptions.from }),
			...(exportOptions.to && { to: exportOptions.to }),
		});
		const url = URL.createObjectURL(await response.blob());
		triggerBrowserDownload(url, fileName);
	}

	return {
		activities,
		isLoading: activitiesQuery.isLoading,
		error: activitiesQuery.error,
		refresh: activitiesQuery.refresh,
		hasMore,
		loadMore,
		isLoadingMore,
		exportActivities,
	};
}
