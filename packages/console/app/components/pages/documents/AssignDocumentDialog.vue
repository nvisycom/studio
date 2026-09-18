<script setup lang="ts">
import type { WorkspaceDocument as NvisyDocument } from "@nvisy/sdk/datatypes";
import { Loader2, Plus, Trash2, X } from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "#console/components/ui/dialog";
import { Input } from "#console/components/ui/input";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import {
	ReviewStatusControl,
	ReviewerPicker,
} from "#console/components/pages/reviews";

/**
 * Manage a document's reviews. A document can carry several reviews, each opened
 * explicitly (optionally with a purpose) and carrying its own reviewers and
 * status. This lists each review — its reviewers (add via the per-review picker,
 * remove via the X) and its verify/reopen control — and an "open review" row to
 * start a new one. Reads and writes go through the review composable, applied
 * immediately.
 */
const props = withDefaults(
	defineProps<{
		open?: boolean;
		document?: NvisyDocument | null;
	}>(),
	{ open: false, document: null },
);

const emit = defineEmits<{
	"update:open": [value: boolean];
}>();

const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();

const documentId = computed(() => props.document?.id ?? "");
const { reviews, isLoading, refresh } = useDocumentReviews(documentId);
const {
	createReviewAsync,
	assignReviewerAsync,
	unassignReviewerAsync,
	verifyReviewAsync,
	reopenReviewAsync,
	deleteReviewAsync,
	isCreating,
} = useReviews();

// The title for a review about to be opened. Optional in the UI — left blank, it
// defaults to the document's name.
const newTitle = ref("");

// Reset the draft title whenever the dialog closes so it doesn't leak across
// documents.
watch(
	() => props.open,
	(open) => {
		if (!open) newTitle.value = "";
	},
);

// Open a new review on this document. A document can carry several reviews (e.g.
// one per audience), so this always creates a fresh one. A blank title falls back
// to the document's name.
async function openReview() {
	if (!props.document) return;
	const displayName = newTitle.value.trim() || props.document.displayName;
	try {
		await createReviewAsync({
			documentId: props.document.id,
			review: { displayName },
		});
		newTitle.value = "";
		await refresh();
	} catch {
		toast.error(t("reviews.errors.createFailed"));
	}
}

async function removeReview(reviewId: string) {
	try {
		await deleteReviewAsync(reviewId);
		await refresh();
	} catch {
		toast.error(t("reviews.errors.deleteFailed"));
	}
}

// Add a reviewer to a specific review.
async function addReviewer(reviewId: string, accountId: string) {
	try {
		await assignReviewerAsync({ reviewId, accountId });
		await refresh();
	} catch {
		toast.error(t("reviews.errors.assignFailed"));
	}
}

async function removeReviewer(reviewId: string, accountId: string) {
	try {
		await unassignReviewerAsync({ reviewId, accountId });
		await refresh();
	} catch {
		toast.error(t("reviews.errors.unassignFailed"));
	}
}

async function verify(reviewId: string) {
	try {
		await verifyReviewAsync(reviewId);
		await refresh();
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}

async function reopen(reviewId: string) {
	try {
		await reopenReviewAsync(reviewId);
		await refresh();
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t("reviews.dialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ document?.displayName ?? t("reviews.dialog.description") }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-2">
        <div
          v-if="isLoading"
          class="flex items-center justify-center py-6 text-muted-foreground"
        >
          <Loader2 :size="18" class="animate-spin" />
        </div>

        <template v-else>
          <!-- Existing reviews: each with its status, reviewers, and picker. -->
          <ul v-if="reviews.length" class="flex flex-col gap-2">
            <li
              v-for="review in reviews"
              :key="review.id"
              class="flex flex-col gap-2 rounded-lg border border-border/50 p-2.5"
            >
              <div class="group flex items-center justify-between gap-2 px-0.5">
                <span class="min-w-0 truncate text-sm font-medium">
                  {{ review.displayName }}
                </span>
                <div class="flex shrink-0 items-center gap-1">
                  <ReviewStatusControl
                    :status="review.reviewStatus"
                    @verify="verify(review.id)"
                    @reopen="reopen(review.id)"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="size-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    :aria-label="t('reviews.dialog.deleteReview')"
                    @click="removeReview(review.id)"
                  >
                    <Trash2 :size="13" />
                  </Button>
                </div>
              </div>

              <ul
                v-if="review.assignees.length"
                class="flex flex-col"
              >
                <li
                  v-for="reviewer in review.assignees"
                  :key="reviewer.id"
                  class="group flex items-center gap-2.5 rounded-md px-0.5 py-1"
                >
                  <EntityAvatar
                    size="sm"
                    class="!size-6 !text-[10px]"
                    :name="personLabel(reviewer)"
                    :src="resolveAvatarUrl(reviewer.avatarUrl)"
                  />
                  <span class="min-w-0 flex-1 truncate text-sm">
                    {{ personLabel(reviewer) }}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    class="size-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                    :aria-label="t('reviews.dialog.remove')"
                    @click="removeReviewer(review.id, reviewer.id)"
                  >
                    <X :size="13" />
                  </Button>
                </li>
              </ul>
              <p v-else class="px-0.5 text-sm text-muted-foreground">
                {{ t("reviews.dialog.unassigned") }}
              </p>

              <div class="px-0.5">
                <ReviewerPicker
                  :assigned="review.assignees.map((a) => a.id)"
                  @select="addReviewer(review.id, $event)"
                />
              </div>
            </li>
          </ul>

          <p v-else class="text-sm text-muted-foreground">
            {{ t("reviews.dialog.none") }}
          </p>

          <!-- Open a new review (optional title, defaults to the document name). -->
          <form
            class="flex flex-col gap-1.5 border-t border-border/50 pt-3"
            @submit.prevent="openReview"
          >
            <label
              for="review-title"
              class="text-xs font-medium text-muted-foreground"
            >
              {{ t("reviews.dialog.titleLabel") }}
            </label>
            <div class="flex items-center gap-2">
              <Input
                id="review-title"
                v-model="newTitle"
                class="h-8 flex-1"
                :placeholder="
                  document?.displayName ?? t('reviews.dialog.titlePlaceholder')
                "
                :maxlength="255"
              />
              <Button
                type="submit"
                size="sm"
                class="h-8 shrink-0 gap-1.5"
                :disabled="isCreating"
              >
                <Loader2 v-if="isCreating" :size="14" class="animate-spin" />
                <Plus v-else :size="14" />
                {{ t("reviews.dialog.openReview") }}
              </Button>
            </div>
          </form>
        </template>
      </div>
    </DialogContent>
  </Dialog>
</template>
