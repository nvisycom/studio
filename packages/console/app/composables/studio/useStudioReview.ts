import { toast } from "vue-sonner";
import type { MaybeRefOrGetter } from "vue";

/**
 * The studio's review layer for one document: which review is open, opening a new
 * one (attaching the current detection), the assignee + lifecycle mutations, and
 * the comment handlers. Drives the inspector's Review tab ({@link ReviewPanel}).
 */
export function useStudioReview(args: {
	documentId: MaybeRefOrGetter<string | null>;
	documentName: MaybeRefOrGetter<string | null | undefined>;
	detectionId: MaybeRefOrGetter<string | null>;
}) {
	const { t } = useI18n();
	const docId = computed(() => toValue(args.documentId) ?? "");

	const { reviews, isLoading: isLoadingReviews } = useDocumentReviews(docId);
	const {
		createReviewAsync,
		linkDetectionAsync,
		isCreating,
		submitReviewAsync,
		approveReviewAsync,
		requestChangesAsync,
		reopenReviewAsync,
		assignReviewerAsync,
		unassignReviewerAsync,
		isAssigning,
		isUnassigning,
		isSubmitting,
		isApproving,
		isRequestingChanges,
		isReopening,
		deleteReviewAsync,
		isDeleting,
	} = useReviews();

	// Which review is open. Default to the newest once the list loads; reset when
	// the document changes.
	const selectedReviewId = ref<string | null>(null);
	watch(
		[reviews, () => toValue(args.documentId)],
		([list]) => {
			if (!list.some((r) => r.id === selectedReviewId.value))
				selectedReviewId.value = list[0]?.id ?? null;
		},
		{ immediate: true },
	);

	const activeReviewId = computed(() => selectedReviewId.value ?? "");
	const {
		review,
		timeline,
		isLoadingTimeline,
		postComment,
		editComment,
		deleteComment,
		rename,
		isRenaming,
		refresh: refreshReview,
	} = useReview(activeReviewId);
	const { accountId } = useAccount();

	// Rename the open review (its title). Refresh so the new name shows at once.
	async function renameReview(displayName: string) {
		if (!selectedReviewId.value) return;
		try {
			await rename(displayName);
			await refreshReview();
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
		}
	}

	async function openReview() {
		// Capture the document (and its detection) at submission: if the user
		// switches documents while creation is pending, the result belongs to the
		// OLD document, so it must not be selected under — or linked to — the new one.
		const forDocument = toValue(args.documentId);
		const forDetection = toValue(args.detectionId);
		if (!forDocument) return;
		// The server requires a non-blank title (1-255), so default to the document's
		// name (what the documents-list create flow does too).
		const displayName =
			(toValue(args.documentName) ?? "").trim() ||
			t("studio.detections.review.defaultTitle");
		let created: Awaited<ReturnType<typeof createReviewAsync>>;
		try {
			created = await createReviewAsync({
				documentId: forDocument,
				review: { displayName },
			});
		} catch (error) {
			toast.error(t("studio.detections.review.createFailed"), {
				description: getErrorMessage(error, t("common.errors.tryAgain")),
			});
			return;
		}
		// Dropped if the active document changed mid-flight — the new review stays on
		// its own document's list, reachable when the user returns to it.
		if (toValue(args.documentId) !== forDocument) return;
		selectedReviewId.value = created.id;
		// Attach the detection the reviewer is signing off on. Best-effort and in its
		// own catch: the review is already open, so a link failure must not surface
		// as "failed to open review".
		if (forDetection)
			linkDetectionAsync({
				reviewId: created.id,
				detectionId: forDetection,
			}).catch(() => {});
	}

	const assignees = computed(() => review.value?.assignees ?? []);

	// Each mutation awaits, then refreshes the review detail (the list invalidation
	// alone doesn't update the detail query the assignees/status are read from).
	async function addReviewer(id: string) {
		if (!selectedReviewId.value) return;
		try {
			await assignReviewerAsync({
				reviewId: selectedReviewId.value,
				accountId: id,
			});
			await refreshReview();
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
		}
	}
	async function removeReviewer(id: string) {
		if (!selectedReviewId.value) return;
		try {
			await unassignReviewerAsync({
				reviewId: selectedReviewId.value,
				accountId: id,
			});
			await refreshReview();
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
		}
	}
	// Run a lifecycle transition on the open review, then refresh so the new status
	// shows at once.
	async function transition(run: (reviewId: string) => Promise<unknown>) {
		if (!selectedReviewId.value) return;
		try {
			await run(selectedReviewId.value);
			await refreshReview();
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
		}
	}
	const onSubmit = () => transition(submitReviewAsync);
	const onApprove = () => transition(approveReviewAsync);
	const onRequestChanges = () => transition(requestChangesAsync);
	const onReopen = () => transition(reopenReviewAsync);

	// Delete the open review, then select another (the list watcher handles that).
	async function onDelete() {
		if (!selectedReviewId.value) return;
		try {
			await deleteReviewAsync(selectedReviewId.value);
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
		}
	}

	// Comment handlers reject on failure (after toasting) so the composer keeps the
	// user's text.
	async function onComment(body: string) {
		try {
			await postComment(body);
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
			throw error;
		}
	}
	async function onEditComment(commentId: string, body: string) {
		try {
			await editComment(commentId, body);
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
			throw error;
		}
	}
	async function onDeleteComment(commentId: string) {
		try {
			await deleteComment(commentId);
		} catch (error) {
			toast.error(getErrorMessage(error, t("common.errors.generic")));
			throw error;
		}
	}

	return {
		reviews,
		isLoadingReviews,
		selectedReviewId,
		review,
		assignees,
		timeline,
		isLoadingTimeline,
		accountId,
		isCreating,
		isAssigning,
		isUnassigning,
		isSubmitting,
		isApproving,
		isRequestingChanges,
		isReopening,
		isDeleting,
		isRenaming,
		openReview,
		renameReview,
		addReviewer,
		removeReviewer,
		onSubmit,
		onApprove,
		onRequestChanges,
		onReopen,
		onDelete,
		onComment,
		onEditComment,
		onDeleteComment,
	};
}
