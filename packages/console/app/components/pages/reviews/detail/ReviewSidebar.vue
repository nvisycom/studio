<script setup lang="ts">
import { Trash2, X } from "@lucide/vue";
import type { WorkspaceReview } from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { personLabel } from "#console/utils/naming";
import {
	ReviewStatusControl,
	ReviewerPicker,
} from "#console/components/pages/reviews";

/**
 * The review detail page's right rail (GitHub-issue style): review status,
 * assignees (add / remove), who opened the review, and a delete action. Each
 * section owns a heading and its control; the parent wires the mutations.
 */
const props = defineProps<{
	review: WorkspaceReview;
	deleting?: boolean;
}>();

const emit = defineEmits<{
	verify: [];
	reopen: [];
	assign: [accountId: string];
	unassign: [accountId: string];
	delete: [];
}>();

const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();

const assignedIds = computed(() => props.review.assignees.map((a) => a.id));
</script>

<template>
  <aside class="flex w-full flex-col gap-5 text-sm">
    <!-- Status -->
    <section class="flex flex-col gap-2">
      <h3
        class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {{ t("reviews.detail.sidebar.status") }}
      </h3>
      <div>
        <ReviewStatusControl
          :status="review.reviewStatus"
          @verify="emit('verify')"
          @reopen="emit('reopen')"
        />
      </div>
    </section>

    <div class="h-px bg-border/60" />

    <!-- Assignees -->
    <section class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3
          class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ t("reviews.detail.sidebar.reviewers") }}
        </h3>
        <ReviewerPicker :assigned="assignedIds" @select="emit('assign', $event)" />
      </div>
      <p
        v-if="review.assignees.length === 0"
        class="text-sm text-muted-foreground"
      >
        {{ t("reviews.detail.sidebar.noReviewers") }}
      </p>
      <ul v-else class="flex flex-col gap-1">
        <li
          v-for="reviewer in review.assignees"
          :key="reviewer.id"
          class="group flex items-center gap-2"
        >
          <EntityAvatar
            size="sm"
            class="!size-5 !text-[9px]"
            :name="personLabel(reviewer)"
            :src="resolveAvatarUrl(reviewer.avatarUrl)"
          />
          <span class="min-w-0 flex-1 truncate">{{ personLabel(reviewer) }}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            class="size-6 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            :aria-label="t('reviews.detail.sidebar.removeReviewer')"
            @click="emit('unassign', reviewer.id)"
          >
            <X :size="13" />
          </Button>
        </li>
      </ul>
    </section>

    <div class="h-px bg-border/60" />

    <!-- Opened by -->
    <section class="flex flex-col gap-2">
      <h3
        class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {{ t("reviews.detail.sidebar.author") }}
      </h3>
      <div class="flex items-center gap-2">
        <EntityAvatar
          size="sm"
          class="!size-5 !text-[9px]"
          :name="personLabel(review.author)"
          :src="resolveAvatarUrl(review.author.avatarUrl)"
        />
        <span class="min-w-0 truncate">{{ personLabel(review.author) }}</span>
      </div>
    </section>

    <div class="h-px bg-border/60" />

    <!-- Delete -->
    <section>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        :disabled="deleting"
        @click="emit('delete')"
      >
        <Trash2 :size="14" />
        {{ t("reviews.detail.sidebar.delete") }}
      </Button>
    </section>
  </aside>
</template>
