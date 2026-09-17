import type {
	WorkspaceReview,
	WorkspaceReviewEntry,
} from "@nvisy/sdk/datatypes";

/**
 * A single review's detail state: the review itself (assignees, status, title,
 * the document it signs off on) plus its discussion — the timeline (comments
 * interleaved with lifecycle events), posting comments, and renaming the review.
 *
 * The status/assignee mutations live in {@link useReviews} (shared with the
 * queue); this composable owns the per-review reads, the comment posting, and
 * the rename.
 */
export function useReview(reviewId: MaybeRef<string>) {
	const { currentWorkspaceId } = useWorkspaceContext();

	// The review record (assignees, status, documentId, displayName).
	const reviewQuery = workspaceQuery<WorkspaceReview>(
		"review",
		({ client, workspaceId }) =>
			client.reviews.getReview(workspaceId, toValue(reviewId)),
		{
			key: () => ["review", currentWorkspaceId.value, toValue(reviewId)],
			staleTime: 0,
		},
	);

	const review = computed(() => reviewQuery.data.value ?? null);

	// The discussion feed: comments interleaved with lifecycle events, oldest
	// first, addressed by the review's own id.
	const timelineQuery = workspaceQuery<WorkspaceReviewEntry[]>(
		"review-timeline",
		async ({ client, workspaceId }) => {
			const page = await client.reviews.getTimeline(
				workspaceId,
				toValue(reviewId),
			);
			return page.items;
		},
		{
			key: () => [
				"review-timeline",
				currentWorkspaceId.value,
				toValue(reviewId),
			],
			staleTime: 0,
		},
	);

	const timeline = computed(() => timelineQuery.data.value ?? []);

	// Post a comment to the review.
	const commentMutation = workspaceMutation(
		({ client, workspaceId }, body: string) =>
			client.reviews.addComment(workspaceId, toValue(reviewId), { body }),
		{ invalidates: "review-timeline" },
	);

	async function postComment(body: string) {
		await commentMutation.mutateAsync(body);
		await timelineQuery.refresh();
	}

	// Rename the review (its title / purpose label).
	const renameMutation = workspaceMutation(
		({ client, workspaceId }, displayName: string) =>
			client.reviews.updateReview(workspaceId, toValue(reviewId), {
				displayName,
			}),
		{ invalidates: "review" },
	);

	async function rename(displayName: string) {
		await renameMutation.mutateAsync(displayName);
		await reviewQuery.refresh();
	}

	return {
		review,
		isLoading: reviewQuery.isLoading,
		error: reviewQuery.error,
		refresh: reviewQuery.refresh,

		// Discussion.
		timeline,
		isLoadingTimeline: timelineQuery.isLoading,
		refreshTimeline: timelineQuery.refresh,
		postComment,
		isPostingComment: commentMutation.isLoading,

		// Rename.
		rename,
		isRenaming: renameMutation.isLoading,
	};
}
