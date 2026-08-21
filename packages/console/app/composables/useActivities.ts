/**
 * Workspace activity log, backed by `activities.listActivities`. A cursor-
 * paginated, reverse-chronological audit trail (member/file/connection/webhook/
 * invite/workspace events) with a human-readable description and the account
 * that performed each action. Powers the overview's "Recent activity" feed.
 */
export function useActivities(options?: { pageSize?: number }) {
	const { requireContext, currentWorkspaceSlug } = useWorkspaceContext();
	const pageSize = options?.pageSize ?? 20;

	const activitiesQuery = workspaceQuery(
		"activities",
		({ client, workspaceSlug }) =>
			client.activities.listActivities(workspaceSlug, { limit: pageSize }),
		{
			key: () => ["activities", currentWorkspaceSlug.value],
		},
	);

	const {
		items: activities,
		hasMore,
		loadMore,
		isLoadingMore,
	} = useCursorPagination(activitiesQuery.data, (after) => {
		const { client, workspaceSlug } = requireContext();
		return client.activities.listActivities(workspaceSlug, {
			after,
			limit: pageSize,
		});
	});

	/**
	 * Download the activity log as CSV or JSON, saved under `fileName`. The
	 * optional date range is inclusive, `YYYY-MM-DD` (UTC); omit it to use the
	 * SDK's default window.
	 */
	async function exportActivities(
		fileName: string,
		options: { format: "csv" | "json"; from?: string; to?: string },
	): Promise<void> {
		const { client, workspaceSlug } = requireContext();
		const response = await client.activities.exportActivities(workspaceSlug, {
			format: options.format,
			...(options.from && { from: options.from }),
			...(options.to && { to: options.to }),
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
