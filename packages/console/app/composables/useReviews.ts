import type {
	CreateWorkspaceReview,
	CursorPagination,
	WorkspaceReview,
	WorkspaceReviewsQuery,
} from "@nvisy/sdk/datatypes";

/**
 * Document-review operations for the active workspace.
 *
 * A review is a first-class entity: it binds a document to a reviewer (by
 * account id), carries its own discussion, and tracks its status
 * `needs_review → in_review → resolved`. This composable covers the review queue
 * (filtered by assignee / status / document), plus creating, assigning,
 * verifying (→ resolved), reopening, and deleting a review.
 *
 * `query` filters the queue (by `assignee` account id, `reviewStatus`, or
 * `documentId`) and paginates it — pass `assignee` to scope to one reviewer.
 */
export function useReviews(
	query?: MaybeRef<(CursorPagination & WorkspaceReviewsQuery) | undefined>,
) {
	const { requireContext, currentWorkspaceId } = useWorkspaceContext();

	const reviewsQuery = workspaceQuery(
		"reviews",
		({ client, workspaceId }) =>
			client.reviews.listReviews(workspaceId, toValue(query)),
		{
			key: () => [
				"reviews",
				currentWorkspaceId.value,
				JSON.stringify(toValue(query) ?? null),
			],
			staleTime: 0,
		},
	);

	// Accumulate further pages beyond the first (the base query owns page one).
	const { items, hasMore, loadMore, isLoadingMore } = useCursorPagination(
		reviewsQuery.data,
		(after) => {
			const { client, workspaceId } = requireContext();
			return client.reviews.listReviews(workspaceId, {
				...toValue(query),
				after,
			});
		},
	);
	const reviews = computed<WorkspaceReview[]>(() => items.value);

	// Open a review on a document (optionally with a purpose/audience label).
	const createReviewMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{
				documentId,
				review,
			}: { documentId: string; review: CreateWorkspaceReview },
		) => client.reviews.createForDocument(workspaceId, documentId, review),
		{ invalidates: "reviews" },
	);

	// Add a reviewer to a review (a review can have several).
	const assignReviewerMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{ reviewId, accountId }: { reviewId: string; accountId: string },
		) => client.reviews.assignReviewer(workspaceId, reviewId, accountId),
		{ invalidates: "reviews" },
	);

	// Remove a reviewer from a review.
	const unassignReviewerMutation = workspaceMutation(
		(
			{ client, workspaceId },
			{ reviewId, accountId }: { reviewId: string; accountId: string },
		) => client.reviews.unassignReviewer(workspaceId, reviewId, accountId),
		{ invalidates: "reviews" },
	);

	// Mark a review verified (→ resolved).
	const verifyReviewMutation = workspaceMutation(
		({ client, workspaceId }, reviewId: string) =>
			client.reviews.verifyReview(workspaceId, reviewId),
		{ invalidates: "reviews" },
	);

	// Reopen a resolved review (→ back to needs_review).
	const reopenReviewMutation = workspaceMutation(
		({ client, workspaceId }, reviewId: string) =>
			client.reviews.reopenReview(workspaceId, reviewId),
		{ invalidates: "reviews" },
	);

	// Delete a review (removes it and its discussion from the document).
	const deleteReviewMutation = workspaceMutation(
		({ client, workspaceId }, reviewId: string) =>
			client.reviews.deleteReview(workspaceId, reviewId),
		{ invalidates: "reviews" },
	);

	return {
		// The review queue (filtered by `query`).
		reviews,
		total: computed(() => reviewsQuery.data.value?.total ?? null),
		hasMore,
		loadMore,
		isLoadingMore,
		isLoading: reviewsQuery.isLoading,
		error: reviewsQuery.error,
		refresh: reviewsQuery.refresh,

		// Open a review on a document.
		createReview: createReviewMutation.mutate,
		createReviewAsync: createReviewMutation.mutateAsync,
		isCreating: createReviewMutation.isLoading,

		// Add a reviewer to a review.
		assignReviewer: assignReviewerMutation.mutate,
		assignReviewerAsync: assignReviewerMutation.mutateAsync,
		isAssigning: assignReviewerMutation.isLoading,
		assignError: assignReviewerMutation.error,

		// Remove a reviewer from a review.
		unassignReviewer: unassignReviewerMutation.mutate,
		unassignReviewerAsync: unassignReviewerMutation.mutateAsync,
		isUnassigning: unassignReviewerMutation.isLoading,

		// Verify a review (→ resolved).
		verifyReview: verifyReviewMutation.mutate,
		verifyReviewAsync: verifyReviewMutation.mutateAsync,
		isVerifying: verifyReviewMutation.isLoading,

		// Reopen a resolved review.
		reopenReview: reopenReviewMutation.mutate,
		reopenReviewAsync: reopenReviewMutation.mutateAsync,
		isReopening: reopenReviewMutation.isLoading,

		// Delete a review.
		deleteReview: deleteReviewMutation.mutate,
		deleteReviewAsync: deleteReviewMutation.mutateAsync,
		isDeleting: deleteReviewMutation.isLoading,
	};
}

/**
 * The reviews on a single document (most recent first), each with its assignee
 * and status. A document can carry more than one review.
 */
export function useDocumentReviews(documentId: MaybeRef<string>) {
	const { currentWorkspaceId } = useWorkspaceContext();

	const q = workspaceQuery<WorkspaceReview[]>(
		"document-reviews",
		({ client, workspaceId }) =>
			client.reviews.listForDocument(workspaceId, toValue(documentId)),
		{
			key: () => [
				"document-reviews",
				currentWorkspaceId.value,
				toValue(documentId),
			],
			// No document selected yet — don't query with an empty id.
			enabled: () => !!toValue(documentId),
			staleTime: 0,
		},
	);

	return {
		reviews: computed(() => q.data.value ?? []),
		isLoading: q.isLoading,
		error: q.error,
		refresh: q.refresh,
	};
}
