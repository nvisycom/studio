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

	return {
		activities,
		isLoading: activitiesQuery.isLoading,
		error: activitiesQuery.error,
		refresh: activitiesQuery.refresh,
		hasMore,
		loadMore,
		isLoadingMore,
	};
}
