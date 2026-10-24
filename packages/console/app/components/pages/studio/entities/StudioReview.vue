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

// All the review logic (selection, open/link, assign/verify/reopen, comments) is
// shared with the full-screen review via this composable.
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
	isVerifying,
	isReopening,
	openReview,
	addReviewer,
	removeReviewer,
	onVerify,
	onReopen,
	onComment,
	onEditComment,
	onDeleteComment,
} = useStudioReview({
	documentId: () => props.documentId,
	documentName: () => props.documentName,
	detectionId: () => props.detectionId,
});
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
      <div class="shrink-0 space-y-3 border-b p-3 text-sm">
        <!-- Status -->
        <div class="grid grid-cols-[5rem_1fr] items-center gap-2">
          <span class="section-label">
            {{ t("studio.detections.review.status") }}
          </span>
          <ReviewStatusControl
            class="justify-self-end"
            :status="review.reviewStatus"
            :loading="isVerifying || isReopening"
            @verify="onVerify"
            @reopen="onReopen"
          />
        </div>
        <!-- Reviewers -->
        <div class="grid grid-cols-[5rem_1fr] items-center gap-2">
          <span class="section-label">
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
            />
          </div>
        </div>
        <!-- Linked context: what this review points at (read-only pointer). -->
        <div
          v-if="detectionId"
          class="grid grid-cols-[5rem_1fr] items-center gap-2"
        >
          <span class="section-label">
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
          :current-account-id="accountId"
          :on-comment="onComment"
          :on-edit-comment="onEditComment"
          :on-delete-comment="onDeleteComment"
        />
      </div>
    </template>
  </div>
</template>
