<script setup lang="ts">
import { Loader2, GitCommitHorizontal } from "@lucide/vue";
import type { WorkspaceReviewEntry } from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import { Textarea } from "#console/components/ui/textarea";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { personLabel } from "#console/utils/naming";

/**
 * The review's discussion feed — comment cards interleaved with inline event
 * lines (opened / closed / renamed), oldest first, GitHub-timeline style. A
 * composer at the bottom posts a new comment.
 */
defineProps<{
	entries: WorkspaceReviewEntry[];
	loading?: boolean;
	posting?: boolean;
}>();

const emit = defineEmits<{
	// `onSuccess` clears the composer — the parent calls it only once the comment
	// is posted, so a failed submit keeps the user's text.
	comment: [body: string, onSuccess: () => void];
}>();

const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();
const { relativeTime } = useRelativeTime();

const draft = ref("");

function submit() {
	const body = draft.value.trim();
	if (!body) return;
	emit("comment", body, () => {
		draft.value = "";
	});
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="loading"
      class="flex items-center justify-center py-10 text-muted-foreground"
    >
      <Loader2 :size="20" class="animate-spin" />
    </div>

    <ol v-else class="relative flex flex-col gap-4">
      <!-- The vertical rail running through the feed. -->
      <span
        aria-hidden="true"
        class="absolute bottom-4 left-3.5 top-4 w-px bg-border"
      />

      <li
        v-for="entry in entries"
        :key="entry.id"
        class="relative flex gap-3"
      >
        <!-- Comment: a full card with the author's avatar. -->
        <template v-if="entry.type === 'comment'">
          <EntityAvatar
            size="sm"
            class="z-10 mt-0.5 shrink-0 ring-2 ring-background"
            :name="personLabel(entry.author)"
            :src="resolveAvatarUrl(entry.author.avatarUrl)"
          />
          <div class="min-w-0 flex-1 rounded-lg border border-border/60">
            <div
              class="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-3 py-1.5 text-sm"
            >
              <span class="font-medium text-foreground">
                {{ personLabel(entry.author) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ relativeTime(entry.createdAt) }}
              </span>
            </div>
            <p class="whitespace-pre-wrap px-3 py-2.5 text-sm text-foreground">
              {{ entry.body }}
            </p>
          </div>
        </template>

        <!-- Event: a compact inline line with a marker. -->
        <template v-else>
          <span
            class="z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background"
          >
            <GitCommitHorizontal :size="14" />
          </span>
          <p class="flex flex-wrap items-baseline gap-1.5 pt-1 text-sm text-muted-foreground">
            <span v-if="entry.actor" class="font-medium text-foreground">
              {{ personLabel(entry.actor) }}
            </span>
            <span>{{ t(`reviews.detail.events.${entry.kind}`) }}</span>
            <span class="text-xs">{{ relativeTime(entry.createdAt) }}</span>
          </p>
        </template>
      </li>
    </ol>

    <!-- Comment composer -->
    <form class="flex flex-col gap-2" @submit.prevent="submit">
      <Textarea
        v-model="draft"
        :placeholder="t('reviews.detail.commentPlaceholder')"
        rows="3"
        class="resize-y"
      />
      <div class="flex justify-end">
        <Button type="submit" size="sm" :disabled="!draft.trim() || posting">
          <Loader2 v-if="posting" :size="14" class="mr-1.5 animate-spin" />
          {{ t("reviews.detail.comment") }}
        </Button>
      </div>
    </form>
  </div>
</template>
