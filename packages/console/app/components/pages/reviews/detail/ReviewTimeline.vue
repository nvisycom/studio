<script setup lang="ts">
import {
	Check,
	CircleDot,
	FileSearch,
	GitCommitHorizontal,
	Loader2,
	MoreHorizontal,
	Pencil,
	RotateCcw,
	Scissors,
	Trash2,
	UserMinus,
	UserPlus,
} from "@lucide/vue";
import type {
	ReviewEventKind,
	WorkspaceReviewEntry,
} from "@nvisy/sdk/datatypes";
import type { Component } from "vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import {
	MentionInput,
	type MentionCandidate,
} from "#console/components/ui/mention-input";
import { ConfirmDialog } from "#console/components/shared";
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
	// The viewer's account id — comments they authored get edit/delete actions.
	currentAccountId?: string | null;
	// Post a comment. Its promise settles when the post does: resolve clears the
	// composer, reject keeps the user's text. While it is pending the composer is
	// disabled, so the same comment can't be sent twice.
	onComment: (body: string) => Promise<void>;
	// Edit / delete a comment. Omit to render comments read-only. The promise
	// settling drives the row's loading state.
	onEditComment?: (commentId: string, body: string) => Promise<void>;
	onDeleteComment?: (commentId: string) => Promise<void>;
}>();

const { t } = useI18n();
const { resolveAvatarUrl } = useAvatarUrl();
const { relativeTime } = useRelativeTime();
const { members } = useMembers();

// A distinct marker icon per event kind, so the timeline is scannable at a
// glance. An unknown/future kind falls back to the neutral commit marker.
const EVENT_ICONS: Record<ReviewEventKind, Component> = {
	"review.opened": CircleDot,
	"review.renamed": Pencil,
	"detection.linked": FileSearch,
	"redaction.linked": Scissors,
	assigned: UserPlus,
	unassigned: UserMinus,
	verified: Check,
	reopened: RotateCcw,
};
function eventIcon(kind: string): Component {
	return EVENT_ICONS[kind as ReviewEventKind] ?? GitCommitHorizontal;
}

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

// Comment management (edit/delete), only for the viewer's own comments and only
// when the parent wired the callbacks.
type CommentEntry = Extract<WorkspaceReviewEntry, { type: "comment" }>;
function canManage(entry: CommentEntry): boolean {
	return !!props.currentAccountId && entry.author.id === props.currentAccountId;
}
// A comment the author changed after posting (server bumps updatedAt).
function isEdited(entry: CommentEntry): boolean {
	return entry.updatedAt !== entry.createdAt;
}

// Inline edit: which comment is open, its draft, and a busy latch.
const editingId = ref<string | null>(null);
const editDraft = ref("");
const busyId = ref<string | null>(null);

function startEdit(entry: CommentEntry) {
	editingId.value = entry.id;
	editDraft.value = entry.body;
}
function cancelEdit() {
	editingId.value = null;
	editDraft.value = "";
}
async function saveEdit(entry: CommentEntry) {
	const body = editDraft.value.trim();
	if (!body || !props.onEditComment || busyId.value) return;
	busyId.value = entry.id;
	try {
		await props.onEditComment(entry.id, body);
		cancelEdit();
	} catch {
		// The parent toasts; keep the editor open so the text isn't lost.
	} finally {
		busyId.value = null;
	}
}

// Delete: a confirm step before the destructive call.
const deletingEntry = ref<CommentEntry | null>(null);
async function confirmDelete() {
	const entry = deletingEntry.value;
	if (!entry || !props.onDeleteComment) return;
	busyId.value = entry.id;
	try {
		await props.onDeleteComment(entry.id);
		deletingEntry.value = null;
	} catch {
		// The parent toasts.
	} finally {
		busyId.value = null;
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
              <span v-if="isEdited(entry)" class="text-xs text-muted-foreground">
                · {{ t("reviews.detail.commentActions.edited") }}
              </span>
              <!-- Own-comment actions: edit (inline) + delete (confirm). -->
              <DropdownMenu
                v-if="
                  canManage(entry) &&
                  (onEditComment || onDeleteComment) &&
                  editingId !== entry.id
                "
              >
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="ml-auto size-6 shrink-0 text-muted-foreground"
                    :disabled="busyId === entry.id"
                    :aria-label="t('reviews.detail.commentActions.actions')"
                  >
                    <MoreHorizontal :size="15" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="onEditComment"
                    @select="startEdit(entry)"
                  >
                    <Pencil :size="14" />
                    {{ t("reviews.detail.commentActions.edit") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="onDeleteComment"
                    class="text-destructive focus:text-destructive"
                    @select="deletingEntry = entry"
                  >
                    <Trash2 :size="14" />
                    {{ t("reviews.detail.commentActions.delete") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- Inline editor for this comment. -->
            <div v-if="editingId === entry.id" class="flex flex-col gap-2 p-3">
              <MentionInput
                v-model="editDraft"
                :candidates="mentionCandidates"
                :placeholder="t('reviews.detail.commentPlaceholder')"
                @submit="saveEdit(entry)"
              />
              <div class="flex justify-end gap-2">
                <Button variant="ghost" size="sm" @click="cancelEdit">
                  {{ t("common.cancel") }}
                </Button>
                <Button
                  size="sm"
                  :disabled="!editDraft.trim() || busyId === entry.id"
                  @click="saveEdit(entry)"
                >
                  <Loader2
                    v-if="busyId === entry.id"
                    :size="14"
                    class="mr-1.5 animate-spin"
                  />
                  {{ t("reviews.detail.commentActions.save") }}
                </Button>
              </div>
            </div>

            <!-- Rendered comment body. -->
            <p
              v-else
              class="whitespace-pre-wrap px-3 py-2.5 text-sm text-foreground"
            >
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
            <component :is="eventIcon(entry.kind)" :size="13" />
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

    <!-- Delete-comment confirm. -->
    <ConfirmDialog
      :open="!!deletingEntry"
      :title="t('reviews.detail.commentActions.deleteTitle')"
      :description="t('reviews.detail.commentActions.deleteDescription')"
      :confirm-label="t('reviews.detail.commentActions.delete')"
      :cancel-label="t('common.cancel')"
      :is-loading="!!deletingEntry && busyId === deletingEntry.id"
      @update:open="(v) => !v && (deletingEntry = null)"
      @confirm="confirmDelete"
    />
  </div>
</template>
