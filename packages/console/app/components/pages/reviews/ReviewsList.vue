<script setup lang="ts">
import { ClipboardCheck, FileText, Loader2 } from "@lucide/vue";
import type { ReviewStatus, WorkspaceReview } from "@nvisy/sdk/datatypes";
import type { VirtualColumn } from "#console/components/ui/virtual-table";
import { VirtualTable } from "#console/components/ui/virtual-table";
import { Tabs, TabsList, TabsTrigger } from "#console/components/ui/tabs";
import { personLabel } from "#console/utils/naming";
import { toast } from "vue-sonner";
import ReviewStatusControl from "./ReviewStatusControl.vue";
import { REVIEW_STATUSES } from "#console/utils/reviews";

/**
 * The reviewer's queue as a table: document reviews assigned to a reviewer,
 * filtered by status, each row opening the document in the studio and carrying
 * an inline verify/reopen control. Used by the Reviews page.
 *
 * `assignee` is the account id whose reviews to show (the current user's, for
 * the "my reviews" queue).
 */
const props = defineProps<{
	/** Account id whose review queue to show. */
	assignee: string;
}>();

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { resolveAvatarUrl } = useAvatarUrl();
const { relativeTime } = useRelativeTime();

// Status filter as a tab value: "all" or one of the review statuses.
const activeTab = ref<"all" | ReviewStatus>("all");

const query = computed(() => ({
	assignee: props.assignee,
	...(activeTab.value !== "all" ? { reviewStatus: activeTab.value } : {}),
	limit: 50,
}));

const {
	reviews,
	hasMore,
	loadMore,
	isLoadingMore,
	isLoading,
	verifyReviewAsync,
	reopenReviewAsync,
} = useReviews(query);

const rows = computed(() => reviews.value);

const columns = computed<VirtualColumn<WorkspaceReview>[]>(() => [
	{
		key: "document",
		header: t("reviews.table.document"),
		cell: () => ({ type: "custom" }),
	},
	{
		key: "assignee",
		header: t("reviews.table.reviewer"),
		width: "200px",
		cell: (r) => {
			const first = r.assignees[0];
			const extra = r.assignees.length - 1;
			return {
				type: "avatar" as const,
				name: first
					? extra > 0
						? `${personLabel(first)} +${extra}`
						: personLabel(first)
					: "—",
				src: first ? resolveAvatarUrl(first.avatarUrl) : undefined,
				size: "sm" as const,
			};
		},
	},
	{
		key: "assigned",
		header: t("reviews.table.assigned"),
		width: "150px",
		cell: (r) => ({
			type: "text",
			value: relativeTime(r.createdAt),
			muted: true,
		}),
	},
	{
		key: "status",
		header: t("reviews.table.status"),
		width: "150px",
		cell: () => ({ type: "custom" }),
	},
]);

async function verify(reviewId: string) {
	try {
		await verifyReviewAsync(reviewId);
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}

async function reopen(reviewId: string) {
	try {
		await reopenReviewAsync(reviewId);
	} catch {
		toast.error(t("reviews.errors.updateFailed"));
	}
}

// The table emits `load-more` as the viewport nears the end; only fetch when
// there's another page and one isn't already in flight.
function handleLoadMore() {
	if (hasMore.value && !isLoadingMore.value) loadMore();
}

// Open the review's detail page.
function openReview(review: WorkspaceReview) {
	navigateTo(wLink(`/reviews/${review.id}`));
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Status filter -->
    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="all">{{ t("reviews.filter.all") }}</TabsTrigger>
        <TabsTrigger
          v-for="status in REVIEW_STATUSES"
          :key="status"
          :value="status"
        >
          {{ t(`reviews.status.${status}`) }}
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <!-- Loading (first page) -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-16 text-muted-foreground"
    >
      <Loader2 :size="22" class="animate-spin" />
    </div>

    <VirtualTable
      v-else
      :rows="rows"
      :columns="columns"
      max-height="60vh"
      :empty="{
        icon: ClipboardCheck,
        title: t('reviews.empty.title'),
        description: t('reviews.empty.hint'),
      }"
      @load-more="handleLoadMore"
      @row-dblclick="openReview"
    >
      <!-- Document + review purpose, opening the document in the studio. -->
      <template #cell-document="{ row }">
        <div class="flex min-w-0 items-center gap-2">
          <FileText :size="16" class="shrink-0 text-muted-foreground" />
          <button
            type="button"
            class="truncate text-left text-sm font-medium text-foreground hover:underline"
            @click.stop="openReview(row)"
          >
            {{ row.displayName }}
          </button>
        </div>
      </template>

      <!-- Inline verify / reopen control. -->
      <template #cell-status="{ row }">
        <ReviewStatusControl
          :status="row.reviewStatus"
          @verify="verify(row.id)"
          @reopen="reopen(row.id)"
        />
      </template>
    </VirtualTable>
  </div>
</template>
