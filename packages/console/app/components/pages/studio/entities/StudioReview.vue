<script setup lang="ts">
import { Check, ChevronDown, FileSearch, Plus, X } from "@lucide/vue";
import { toast } from "vue-sonner";
import ReviewStatusControl from "../../reviews/ReviewStatusControl.vue";
import ReviewerPicker from "../../reviews/ReviewerPicker.vue";
import ReviewTimeline from "../../reviews/detail/ReviewTimeline.vue";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";

/**
 * The studio's Review tab: the document's review discussion + sign-off, the third
 * step after Detect and Audit. It lists the document's reviews (a switcher), lets
 * the reviewer open a new one (attaching the current detection), and shows the
 * selected review's status, assignees, a compact "linked" line, and the comment
 * timeline. Detections/redactions themselves live in the sibling Detect/Audit
 * tabs — this tab is only the review layer.
 */
const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();

const props = defineProps<{
	/** The document under review (the studio's active file). */
	documentId: string | null;
	/** The document's display name, the default title for a new review. */
	documentName?: string | null;
	/** The detection currently shown, attached to a review opened from here. */
	detectionId: string | null;
}>();

const documentId = computed(() => props.documentId ?? "");
const { reviews, isLoading: isLoadingReviews } = useDocumentReviews(documentId);
const {
	createReviewAsync,
	linkDetectionAsync,
	isCreating,
	verifyReviewAsync,
	reopenReviewAsync,
	assignReviewerAsync,
	unassignReviewerAsync,
	isAssigning,
} = useReviews();

// Which review is open. Default to the newest once the list loads; reset when the
// document changes.
const selectedReviewId = ref<string | null>(null);
watch(
	[reviews, () => props.documentId],
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
	isPostingComment,
	refresh: refreshReview,
} = useReview(activeReviewId);

async function openReview() {
	if (!props.documentId) return;
	// The server requires a non-blank title (1-255), so default to the document's
	// name (what the documents-list create flow does too).
	const displayName =
		(props.documentName ?? "").trim() ||
		t("studio.detections.review.defaultTitle");
	let created: Awaited<ReturnType<typeof createReviewAsync>>;
	try {
		created = await createReviewAsync({
			documentId: props.documentId,
			review: { displayName },
		});
	} catch (error) {
		toast.error(t("studio.detections.review.createFailed"), {
			description: getErrorMessage(error, t("common.errors.tryAgain")),
		});
		return;
	}
	selectedReviewId.value = created.id;
	// Attach the detection the reviewer is signing off on. Best-effort and in its
	// own catch: the review is already open, so a link failure must not surface as
	// "failed to open review".
	if (props.detectionId)
		linkDetectionAsync({
			reviewId: created.id,
			detectionId: props.detectionId,
		}).catch(() => {});
}

// Which assignee avatars to show + add/remove. The assign/unassign mutations
// invalidate the reviews LIST, but this tab reads assignees from the review
// DETAIL query — refresh it so the avatars update without a page reload.
const assignees = computed(() => review.value?.assignees ?? []);
async function addReviewer(accountId: string) {
	if (!selectedReviewId.value) return;
	try {
		await assignReviewerAsync({ reviewId: selectedReviewId.value, accountId });
		await refreshReview();
	} catch (error) {
		toast.error(getErrorMessage(error, t("common.errors.generic")));
	}
}
async function removeReviewer(accountId: string) {
	if (!selectedReviewId.value) return;
	try {
		await unassignReviewerAsync({
			reviewId: selectedReviewId.value,
			accountId,
		});
		await refreshReview();
	} catch (error) {
		toast.error(getErrorMessage(error, t("common.errors.generic")));
	}
}

function onComment(body: string, onSuccess: () => void) {
	postComment(body)
		.then(onSuccess)
		.catch((error) =>
			toast.error(getErrorMessage(error, t("common.errors.generic"))),
		);
}
async function onVerify() {
	if (!selectedReviewId.value) return;
	try {
		await verifyReviewAsync(selectedReviewId.value);
		await refreshReview();
	} catch (error) {
		toast.error(getErrorMessage(error, t("common.errors.generic")));
	}
}
async function onReopen() {
	if (!selectedReviewId.value) return;
	try {
		await reopenReviewAsync(selectedReviewId.value);
		await refreshReview();
	} catch (error) {
		toast.error(getErrorMessage(error, t("common.errors.generic")));
	}
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Review switcher + New. Mirrors the Audit tab's detection switcher. -->
    <div class="flex shrink-0 items-center gap-2 border-b px-2 py-1.5">
      <DropdownMenu v-if="reviews.length">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            class="h-8 min-w-0 flex-1 justify-start gap-1.5 px-2 text-sm font-normal"
          >
            <span class="min-w-0 flex-1 truncate text-left">
              {{ review?.displayName ?? t("studio.detections.review.none") }}
            </span>
            <ChevronDown :size="14" class="shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          class="w-(--reka-dropdown-menu-trigger-width) min-w-64"
        >
          <DropdownMenuItem
            v-for="r in reviews"
            :key="r.id"
            class="gap-2"
            @select="selectedReviewId = r.id"
          >
            <Check
              :size="14"
              class="shrink-0"
              :class="r.id === selectedReviewId ? 'opacity-100' : 'opacity-0'"
            />
            <span class="min-w-0 flex-1 truncate">{{ r.displayName }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span v-else class="min-w-0 flex-1 truncate px-2 text-sm text-muted-foreground">
        {{ t("studio.detections.review.none") }}
      </span>
      <Button
        size="sm"
        variant="outline"
        class="h-8 shrink-0 gap-1.5 px-2.5 text-sm"
        :disabled="!documentId || isCreating"
        @click="openReview"
      >
        <Plus :size="15" />
        {{ t("studio.detections.review.new") }}
      </Button>
    </div>

    <!-- No review yet: a gentle prompt to open one. -->
    <div
      v-if="!reviews.length && !isLoadingReviews"
      class="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground"
    >
      {{ t("studio.detections.review.startHint") }}
    </div>

    <!-- The selected review: status + assignees + linked context + timeline. -->
    <template v-else-if="review">
      <div class="shrink-0 space-y-2.5 border-b px-3 py-2.5 text-sm">
        <!-- Status -->
        <div class="grid grid-cols-[5rem_1fr] items-center gap-2">
          <span class="text-xs text-muted-foreground">
            {{ t("studio.detections.review.status") }}
          </span>
          <ReviewStatusControl
            class="justify-self-end"
            :status="review.reviewStatus"
            @verify="onVerify"
            @reopen="onReopen"
          />
        </div>
        <!-- Reviewers -->
        <div class="grid grid-cols-[5rem_1fr] items-center gap-2">
          <span class="text-xs text-muted-foreground">
            {{ t("studio.detections.review.reviewers") }}
          </span>
          <div class="flex flex-wrap items-center justify-end gap-1">
            <span
              v-for="a in assignees"
              :key="a.id"
              class="group/assignee inline-flex items-center gap-1 rounded-full bg-muted py-0.5 pl-0.5 pr-2 text-xs"
            >
              <EntityAvatar
                size="sm"
                :name="a.displayName ?? a.username"
                :src="resolveAvatarUrl(a.avatarUrl)"
              />
              <span class="truncate">{{ a.displayName ?? a.username }}</span>
              <button
                type="button"
                class="text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="t('common.remove')"
                @click="removeReviewer(a.id)"
              >
                <X :size="12" />
              </button>
            </span>
            <ReviewerPicker
              :assigned="assignees.map((a) => a.id)"
              :loading="isAssigning"
              @select="addReviewer"
            />
          </div>
        </div>
        <!-- Linked context: what this review points at (read-only pointer). -->
        <div
          v-if="detectionId"
          class="grid grid-cols-[5rem_1fr] items-center gap-2"
        >
          <span class="text-xs text-muted-foreground">
            {{ t("studio.detections.review.linked") }}
          </span>
          <span
            class="inline-flex w-fit items-center gap-1 justify-self-end rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
          >
            <FileSearch :size="13" />
            {{ t("studio.detections.review.linkedDetection") }}
          </span>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-3">
        <ReviewTimeline
          :entries="timeline"
          :loading="isLoadingTimeline"
          :posting="isPostingComment"
          @comment="onComment"
        />
      </div>
    </template>
  </div>
</template>
