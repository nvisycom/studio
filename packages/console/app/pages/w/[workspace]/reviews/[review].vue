<script setup lang="ts">
import {
	ArrowLeft,
	Check,
	FileText,
	Loader2,
	Pencil,
	ScanSearch,
	X,
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { Button } from "#console/components/ui/button";
import { Input } from "#console/components/ui/input";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#console/components/ui/tabs";
import { Badge } from "#console/components/ui/badge";
import ReviewTimeline from "#console/components/pages/reviews/detail/ReviewTimeline.vue";
import ReviewSidebar from "#console/components/pages/reviews/detail/ReviewSidebar.vue";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { ConfirmDialog } from "#console/components/shared";
import { personLabel } from "#console/utils/naming";
import { reviewStatusVariant } from "#console/utils/reviews";

/**
 * A review's detail page — a GitHub-issue-style surface for one document review.
 * The header carries the review's (editable) title + status and links out to the
 * reviewed document; the main column has tabs (Discussion, Detections,
 * Redactions); the right rail (see {@link ReviewSidebar}) holds status and
 * reviewers.
 *
 * Detections/redactions are the DOCUMENT's (what the reviewer reviews), not the
 * review's own links — the review is scoped to a single document.
 */
const { t } = useI18n();
const route = useRoute();
const { wLink } = useWorkspaceLink();
const { relativeTime } = useRelativeTime();
const { resolveAvatarUrl } = useAvatarUrl();

const reviewId = computed(() => route.params.review as string);

const {
	review,
	isLoading,
	error,
	timeline,
	isLoadingTimeline,
	postComment,
	isPostingComment,
	rename,
	isRenaming,
	refresh,
} = useReview(reviewId);

// Review actions (shared with the queue). Applied to this review by id.
const {
	verifyReviewAsync,
	reopenReviewAsync,
	assignReviewerAsync,
	unassignReviewerAsync,
	deleteReviewAsync,
	isDeleting,
} = useReviews();

// The document under review, and its detections (Detections tab). Redactions
// hang off each detection, surfaced in that tab.
const documentId = computed(() => review.value?.documentId ?? "");
const { getDocument } = useDocuments();
const documentName = ref<string | null>(null);
watch(
	documentId,
	async (id) => {
		if (!id) return;
		try {
			documentName.value = (await getDocument(id)).displayName;
		} catch {
			documentName.value = null;
		}
	},
	{ immediate: true },
);

const { detections: detectionsData, isLoading: isLoadingDetections } =
	useDetections(() =>
		documentId.value ? { documentId: documentId.value } : {},
	);
const detections = computed(() => detectionsData.value ?? []);

const { redactions, isLoading: isLoadingRedactions } =
	useDocumentRedactions(documentId);

useHead({
	title: () => review.value?.displayName ?? t("reviews.detail.title"),
});

// Inline title editing (rename the review).
const isEditingTitle = ref(false);
const titleDraft = ref("");

function startEditTitle() {
	titleDraft.value = review.value?.displayName ?? "";
	isEditingTitle.value = true;
}
function cancelEditTitle() {
	isEditingTitle.value = false;
}
async function saveTitle() {
	const next = titleDraft.value.trim();
	if (!next || next === review.value?.displayName) {
		isEditingTitle.value = false;
		return;
	}
	try {
		await rename(next);
		isEditingTitle.value = false;
	} catch {
		toast.error(t("reviews.detail.renameFailed"));
	}
}

definePageMeta({ pageCategory: "header.category.reviews" });

async function verify() {
	try {
		await verifyReviewAsync(reviewId.value);
		await refresh();
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}
async function reopen() {
	try {
		await reopenReviewAsync(reviewId.value);
		await refresh();
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}
async function assign(accountId: string) {
	try {
		await assignReviewerAsync({ reviewId: reviewId.value, accountId });
		await refresh();
	} catch {
		toast.error(t("reviews.errors.assignFailed"));
	}
}
async function unassign(accountId: string) {
	try {
		await unassignReviewerAsync({ reviewId: reviewId.value, accountId });
		await refresh();
	} catch {
		toast.error(t("reviews.errors.unassignFailed"));
	}
}

async function comment(body: string, onSuccess: () => void) {
	try {
		await postComment(body);
		onSuccess();
	} catch {
		toast.error(t("reviews.detail.commentFailed"));
	}
}

// Deleting is destructive and irreversible, so it goes through a confirmation.
const showDeleteConfirm = ref(false);

async function confirmDelete() {
	try {
		await deleteReviewAsync(reviewId.value);
		await navigateTo(wLink("/reviews"));
	} catch {
		toast.error(t("reviews.errors.deleteFailed"));
	}
}

function openInStudio() {
	if (documentId.value)
		navigateTo(wLink(`/documents?open=${documentId.value}`));
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <!-- Back link -->
      <NuxtLink
        :to="wLink('/reviews')"
        class="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft :size="14" />
        {{ t("reviews.detail.back") }}
      </NuxtLink>

      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-20 text-muted-foreground"
      >
        <Loader2 :size="24" class="animate-spin" />
      </div>

      <!-- Error: the review couldn't be loaded. -->
      <div
        v-else-if="error || !review"
        class="flex flex-col items-center gap-3 py-20 text-center"
      >
        <p class="text-sm text-muted-foreground">
          {{ t("reviews.detail.loadFailed") }}
        </p>
        <Button variant="outline" size="sm" @click="refresh()">
          {{ t("reviews.detail.retry") }}
        </Button>
      </div>

      <template v-else>
        <!-- Header: review title (editable) + document link + status -->
        <header class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 flex-col gap-1">
            <!-- Editing the title. -->
            <form
              v-if="isEditingTitle"
              class="flex items-center gap-1.5"
              @submit.prevent="saveTitle"
            >
              <Input
                v-model="titleDraft"
                autofocus
                class="h-9 text-lg font-semibold"
                :maxlength="255"
                :placeholder="t('reviews.detail.titlePlaceholder')"
                @keydown.esc="cancelEditTitle"
              />
              <Button
                type="submit"
                size="icon-sm"
                class="size-8 shrink-0"
                :disabled="isRenaming"
                :aria-label="t('reviews.detail.saveTitle')"
              >
                <Loader2 v-if="isRenaming" :size="15" class="animate-spin" />
                <Check v-else :size="15" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="size-8 shrink-0"
                :aria-label="t('reviews.detail.cancelTitle')"
                @click="cancelEditTitle"
              >
                <X :size="15" />
              </Button>
            </form>

            <!-- Resting title. -->
            <div v-else class="group flex min-w-0 items-center gap-1.5">
              <h1
                class="truncate text-xl font-semibold tracking-tight text-foreground"
              >
                {{ review.displayName }}
              </h1>
              <Button
                variant="ghost"
                size="icon-sm"
                class="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                :aria-label="t('reviews.detail.editTitle')"
                @click="startEditTitle"
              >
                <Pencil :size="13" />
              </Button>
            </div>

            <!-- Reviewed document → studio. -->
            <button
              type="button"
              class="flex w-fit min-w-0 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
              @click="openInStudio"
            >
              <FileText :size="14" class="shrink-0" />
              <span class="truncate">
                {{ documentName ?? t("reviews.detail.documentFallback") }}
              </span>
            </button>
          </div>
          <Badge :variant="reviewStatusVariant(review.reviewStatus)" class="mt-1 shrink-0 capitalize">
            {{ t(`reviews.status.${review.reviewStatus}`) }}
          </Badge>
        </header>

        <!-- Two-column: main (tabs) + right rail -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div class="min-w-0">
            <Tabs default-value="discussion">
              <TabsList>
                <TabsTrigger value="discussion">
                  {{ t("reviews.detail.tabs.discussion") }}
                </TabsTrigger>
                <TabsTrigger value="detections">
                  {{ t("reviews.detail.tabs.detections") }}
                </TabsTrigger>
                <TabsTrigger value="redactions">
                  {{ t("reviews.detail.tabs.redactions") }}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="discussion" class="pt-4">
                <ReviewTimeline
                  :entries="timeline"
                  :loading="isLoadingTimeline"
                  :posting="isPostingComment"
                  @comment="comment"
                />
              </TabsContent>

              <TabsContent value="detections" class="pt-4">
                <div
                  v-if="isLoadingDetections"
                  class="flex items-center justify-center py-10 text-muted-foreground"
                >
                  <Loader2 :size="20" class="animate-spin" />
                </div>
                <div
                  v-else-if="detections.length === 0"
                  class="flex flex-col items-center gap-2 py-10 text-center"
                >
                  <ScanSearch :size="24" class="text-muted-foreground opacity-40" />
                  <p class="text-sm text-muted-foreground">
                    {{ t("reviews.detail.noDetections") }}
                  </p>
                </div>
                <ul
                  v-else
                  class="divide-y divide-border/50 rounded-lg border border-border/50"
                >
                  <li
                    v-for="detection in detections"
                    :key="detection.id"
                    class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span class="flex min-w-0 items-baseline gap-2">
                      <span class="truncate text-foreground">
                        {{ t(`reviews.detail.triggerType.${detection.triggerType}`) }}
                      </span>
                      <span class="shrink-0 text-xs text-muted-foreground">
                        {{ relativeTime(detection.startedAt) }}
                      </span>
                    </span>
                    <Badge variant="secondary" class="shrink-0 capitalize">
                      {{ detection.status }}
                    </Badge>
                  </li>
                </ul>
              </TabsContent>

              <TabsContent value="redactions" class="pt-4">
                <div
                  v-if="isLoadingRedactions"
                  class="flex items-center justify-center py-10 text-muted-foreground"
                >
                  <Loader2 :size="20" class="animate-spin" />
                </div>
                <div
                  v-else-if="redactions.length === 0"
                  class="flex flex-col items-center gap-2 py-10 text-center"
                >
                  <FileText :size="24" class="text-muted-foreground opacity-40" />
                  <p class="text-sm text-muted-foreground">
                    {{ t("reviews.detail.noRedactions") }}
                  </p>
                </div>
                <ul
                  v-else
                  class="divide-y divide-border/50 rounded-lg border border-border/50"
                >
                  <li
                    v-for="redaction in redactions"
                    :key="redaction.id"
                    class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <span class="flex min-w-0 items-center gap-2">
                      <EntityAvatar
                        size="sm"
                        class="!size-5 !text-[9px]"
                        :name="personLabel(redaction.requestedBy)"
                        :src="resolveAvatarUrl(redaction.requestedBy.avatarUrl)"
                      />
                      <span class="truncate text-foreground">
                        {{ personLabel(redaction.requestedBy) }}
                      </span>
                      <span class="shrink-0 text-xs text-muted-foreground">
                        {{ relativeTime(redaction.createdAt) }}
                      </span>
                    </span>
                    <Badge
                      :variant="redaction.outputDocumentId ? 'default' : 'secondary'"
                      class="shrink-0"
                    >
                      {{
                        redaction.outputDocumentId
                          ? t("reviews.detail.redactionReady")
                          : t("reviews.detail.redactionPending")
                      }}
                    </Badge>
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </div>

          <ReviewSidebar
            :review="review"
            :deleting="isDeleting"
            @verify="verify"
            @reopen="reopen"
            @assign="assign"
            @unassign="unassign"
            @delete="showDeleteConfirm = true"
          />
        </div>
      </template>
    </div>

    <ConfirmDialog
      v-model:open="showDeleteConfirm"
      :title="t('reviews.detail.delete.title')"
      :description="t('reviews.detail.delete.description')"
      :confirm-label="t('reviews.detail.delete.confirm')"
      :cancel-label="t('common.cancel')"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
    />
  </div>
</template>
