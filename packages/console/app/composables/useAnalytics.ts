/**
 * Workspace analytics, backed by `analytics.getAnalytics`. A single snapshot of
 * pipeline-detection health, stored-file totals, and inference-token usage — each
 * with a per-status / per-kind / per-model breakdown. Powers the compact stat
 * strip on the overview and the full breakdowns on the analytics pages.
 */
export function useAnalytics() {
	const { currentWorkspaceSlug } = useWorkspaceContext();

	const analyticsQuery = workspaceQuery(
		"analytics",
		({ client, workspaceSlug }) => client.analytics.getAnalytics(workspaceSlug),
		{
			key: () => ["analytics", currentWorkspaceSlug.value],
		},
	);

	// Daily detection time-series (last ~year, server-defaulted window), for the
	// trend charts and the detection-activity heatmap.
	const timeSeriesQuery = workspaceQuery(
		"analytics-timeseries",
		({ client, workspaceSlug }) =>
			client.analytics.getDetectionTimeSeries(workspaceSlug),
		{
			key: () => ["analytics-timeseries", currentWorkspaceSlug.value],
		},
	);

	return {
		analytics: analyticsQuery.data,
		isLoading: analyticsQuery.isLoading,
		error: analyticsQuery.error,
		refresh: analyticsQuery.refresh,

		timeSeries: timeSeriesQuery.data,
		isLoadingTimeSeries: timeSeriesQuery.isLoading,
	};
}
