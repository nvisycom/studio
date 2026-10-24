<script setup lang="ts">
import {
	Check,
	CheckCircle2,
	ChevronDown,
	Loader2,
	MessageSquareWarning,
	MessagesSquare,
	Plus,
	RotateCcw,
	Send,
	Trash2,
	X,
} from "@lucide/vue";
import type { Component } from "vue";
import ReviewerPicker from "../../reviews/ReviewerPicker.vue";
import ReviewTimeline from "../../reviews/detail/ReviewTimeline.vue";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { ConfirmDialog, EmptyState } from "#console/components/shared";
import { Badge } from "#console/components/ui/badge";
import { Button } from "#console/components/ui/button";
import { reviewStatusVariant } from "#console/utils/reviews";
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

// All the review logic (selection, open/link, assign/verify/reopen, comments) is
// provided by this shared composable.
const {
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
	openReview,
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
} = useStudioReview({
	documentId: () => props.documentId,
	documentName: () => props.documentName,
	detectionId: () => props.detectionId,
});

// Deleting is destructive, so it goes through a confirmation.
const showDeleteConfirm = ref(false);
async function confirmDelete() {
	await onDelete();
	showDeleteConfirm.value = false;
}

// The tab's primary (bottom) action, contextual to state: open a review when
// there's none, otherwise the main status transition. Secondary transitions
// (e.g. request changes) stay as the inline buttons by the status badge.
interface PrimaryAction {
	label: string;
	icon: Component;
	run: () => void;
	loading: boolean;
	disabled: boolean;
}
const primaryAction = computed<PrimaryAction>(() => {
	const r = review.value;
	if (!r)
		return {
			label: t("studio.detections.review.new"),
			icon: Plus,
			run: openReview,
			loading: isCreating.value,
			disabled: !props.documentId,
		};
	switch (r.reviewStatus) {
		case "draft":
		case "changes_requested":
			return {
				label: t("reviews.actions.submit"),
				icon: Send,
				run: onSubmit,
				loading: isSubmitting.value,
				disabled: false,
			};
		case "in_review":
		case "partially_approved":
			return {
				label: t("reviews.actions.approve"),
				icon: CheckCircle2,
				run: onApprove,
				loading: isApproving.value,
				disabled: false,
			};
		case "approved":
			return {
				label: t("reviews.actions.reopen"),
				icon: RotateCcw,
				run: onReopen,
				loading: isReopening.value,
				disabled: false,
			};
	}
});
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- No review yet: an empty state + the bottom CTA creates one. -->
    <EmptyState
      v-if="!reviews.length && !isLoadingReviews"
      compact
      class="min-h-0 flex-1"
      :icon="MessagesSquare"
      :title="t('studio.detections.review.emptyTitle')"
      :description="t('studio.detections.review.emptyHint')"
    />

    <!-- The selected review. -->
    <template v-else-if="review">
      <!-- Header: the review name (switchable) + status, with a quiet add-review
           action; below, the reviewers and the one secondary transition. -->
      <div class="shrink-0 space-y-2 border-b p-3">
        <div class="flex items-center gap-2">
          <!-- Title + switcher: the name reads as a heading; the chevron opens the
               list to switch between the document's reviews. -->
          <DropdownMenu>
            <DropdownMenuTrigger
              class="group/switch flex min-w-0 flex-1 items-center gap-1 rounded text-left outline-none"
            >
              <span class="min-w-0 truncate text-sm font-medium">
                {{ review.displayName }}
              </span>
              <ChevronDown
                :size="14"
                class="shrink-0 text-muted-foreground transition-colors group-hover/switch:text-foreground"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="min-w-64">
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

          <Badge
            :variant="reviewStatusVariant(review.reviewStatus)"
            class="shrink-0 capitalize"
          >
            {{ t(`reviews.status.${review.reviewStatus}`) }}
          </Badge>

          <!-- Open another review (quiet icon; the bottom CTA creates the first). -->
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0 text-muted-foreground"
            :disabled="!documentId || isCreating"
            :title="t('studio.detections.review.new')"
            :aria-label="t('studio.detections.review.new')"
            @click="openReview"
          >
            <Plus :size="16" />
          </Button>
          <!-- Delete the open review (with a confirm — it's easy to open one by
               mistake). -->
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            :disabled="isDeleting"
            :title="t('studio.detections.review.delete')"
            :aria-label="t('studio.detections.review.delete')"
            @click="showDeleteConfirm = true"
          >
            <Trash2 :size="15" />
          </Button>
        </div>

        <!-- Reviewers (avatar stack + add) and the request-changes secondary. -->
        <div class="flex items-center gap-2">
          <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
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
                class="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                :aria-label="t('common.remove')"
                :disabled="isUnassigning"
                @click="removeReviewer(a.id)"
              >
                <X :size="12" />
              </button>
            </span>
            <ReviewerPicker
              :assigned="assignees.map((a) => a.id)"
              :loading="isAssigning"
              @select="addReviewer"
            >
              <template #trigger="{ loading }">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 gap-1 px-2 text-xs text-muted-foreground"
                  :disabled="loading"
                >
                  <Plus :size="14" />
                  {{
                    assignees.length
                      ? t("studio.detections.review.addReviewer")
                      : t("reviews.assign")
                  }}
                </Button>
              </template>
            </ReviewerPicker>
          </div>

          <!-- Secondary transition: request changes (primary is the bottom CTA). -->
          <Button
            v-if="
              review.reviewStatus === 'in_review' ||
              review.reviewStatus === 'partially_approved'
            "
            variant="outline"
            size="sm"
            class="h-7 shrink-0 gap-1.5"
            :disabled="isRequestingChanges"
            @click="onRequestChanges"
          >
            <MessageSquareWarning :size="14" />
            {{ t("reviews.actions.requestChanges") }}
          </Button>
        </div>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto p-3">
        <ReviewTimeline
          :entries="timeline"
          :loading="isLoadingTimeline"
          :current-account-id="accountId"
          :on-comment="onComment"
          :on-edit-comment="onEditComment"
          :on-delete-comment="onDeleteComment"
        />
      </div>
    </template>

    <!-- Primary action, pinned to the bottom (like Detect's Run and Audit's
         Apply): create a review when there's none, otherwise the main status
         transition for the open review. -->
    <div v-if="!isLoadingReviews" class="shrink-0 border-t p-3">
      <Button
        class="w-full gap-2"
        :disabled="primaryAction.disabled || primaryAction.loading"
        @click="primaryAction.run"
      >
        <Loader2
          v-if="primaryAction.loading"
          :size="16"
          class="animate-spin"
        />
        <component :is="primaryAction.icon" v-else :size="16" />
        {{ primaryAction.label }}
      </Button>
    </div>

    <!-- Delete-review confirm. -->
    <ConfirmDialog
      :open="showDeleteConfirm"
      :title="t('studio.detections.review.deleteTitle')"
      :description="t('studio.detections.review.deleteDescription')"
      :confirm-label="t('studio.detections.review.delete')"
      :cancel-label="t('common.cancel')"
      :is-loading="isDeleting"
      @update:open="(v) => !v && (showDeleteConfirm = false)"
      @confirm="confirmDelete"
    />
  </div>
</template>
