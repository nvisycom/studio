<script setup lang="ts">
import { Loader2, GitCommitHorizontal } from "@lucide/vue";
import type { WorkspaceReviewEntry } from "@nvisy/sdk/datatypes";
import { Button } from "#console/components/ui/button";
import {
	MentionInput,
	type MentionCandidate,
} from "#console/components/ui/mention-input";
import EntityAvatar from "#console/components/avatar/EntityAvatar.vue";
import { personLabel } from "#console/utils/naming";

/**
 * The review's discussion feed — comment cards interleaved with inline event
 * lines (opened / closed / renamed), oldest first, GitHub-timeline style. A
 * composer at the bottom posts a new comment.
 */
const props = defineProps<{
	entries: WorkspaceReviewEntry[];
	loading?: boolean;
	// Post a comment. Its promise settles when the post does: resolve clears the
	// composer, reject keeps the user's text. While it is pending the composer is
	// disabled, so the same comment can't be sent twice.
	onComment: (body: string) => Promise<void>;
}>();

const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();
const { relativeTime } = useRelativeTime();
const { members } = useMembers();

// Mention candidates: the reserved AI assistant (pinned, special) + the
// workspace's members. `@assistant` is a server-recognized handle that triggers
// an AI reply in the thread; members are notified of a plain `@username` mention.
const mentionCandidates = computed<MentionCandidate[]>(() => [
	{
		username: "assistant",
		name: t("reviews.detail.assistant"),
		special: true,
	},
	...(members.value ?? []).map((m) => ({
		username: m.username,
		name: personLabel(m),
		avatarUrl: resolveAvatarUrl(m.avatarUrl),
	})),
]);

// A run of a comment body: plain text, or a highlighted `@mention`.
interface BodySegment {
	text: string;
	mention: boolean;
}

// Split a comment body into text + `@mention` segments, so mentions render
// highlighted (matching how they're composed as chips). A mention is `@` + word
// chars at a word boundary — the same shape the server parses.
const MENTION_RE = /(^|\s)(@[\w.-]+)/g;
function bodySegments(body: string): BodySegment[] {
	const out: BodySegment[] = [];
	let last = 0;
	for (const m of body.matchAll(MENTION_RE)) {
		const lead = m[1] ?? "";
		const handle = m[2] ?? "";
		const start = (m.index ?? 0) + lead.length;
		if (start > last)
			out.push({ text: body.slice(last, start), mention: false });
		out.push({ text: handle, mention: true });
		last = start + handle.length;
	}
	if (last < body.length) out.push({ text: body.slice(last), mention: false });
	return out;
}

const draft = ref("");

// One latch owns the whole in-flight post: it gates re-entry (a second Enter
// before the prop updates can't double-send), drives the button's spinner, and
// releases in `finally` on either outcome.
const posting = ref(false);
async function submit() {
	const body = draft.value.trim();
	if (!body || posting.value) return;
	posting.value = true;
	try {
		await props.onComment(body);
		draft.value = "";
	} finally {
		posting.value = false;
	}
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

    <ol v-else class="flex flex-col gap-4">
      <li
        v-for="(entry, i) in entries"
        :key="entry.id"
        class="relative flex gap-3"
      >
        <!-- Per-item rail connector: a line from this marker down to the next.
             Drawn on every item but the last, so the rail never trails off into
             nothing. Centered on the 24px marker (x = 12px). -->
        <span
          v-if="i < entries.length - 1"
          aria-hidden="true"
          class="absolute left-3 top-6 -bottom-4 w-px bg-border"
        />

        <!-- Comment: a full card with the author's avatar. -->
        <template v-if="entry.type === 'comment'">
          <EntityAvatar
            size="sm"
            class="z-10 shrink-0 ring-2 ring-background"
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
              <template
                v-for="(seg, i) in bodySegments(entry.body)"
                :key="i"
              >
                <span
                  v-if="seg.mention"
                  class="rounded bg-primary/10 px-0.5 font-medium text-primary"
                  >{{ seg.text }}</span
                ><template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </div>
        </template>

        <!-- Event: a compact inline line with a marker. -->
        <template v-else>
          <span
            class="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background"
          >
            <GitCommitHorizontal :size="13" />
          </span>
          <p class="flex flex-wrap items-baseline gap-1.5 pt-0.5 text-sm text-muted-foreground">
            <span v-if="entry.actor" class="font-medium text-foreground">
              {{ personLabel(entry.actor) }}
            </span>
            <span>{{ t(`reviews.detail.events.${entry.kind}`) }}</span>
            <span class="text-xs">{{ relativeTime(entry.createdAt) }}</span>
          </p>
        </template>
      </li>
    </ol>

    <!-- Comment composer with @-mentions (members + the AI assistant). -->
    <form class="flex flex-col gap-2" @submit.prevent="submit">
      <MentionInput
        v-model="draft"
        :candidates="mentionCandidates"
        :placeholder="t('reviews.detail.commentPlaceholder')"
        @submit="submit"
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
