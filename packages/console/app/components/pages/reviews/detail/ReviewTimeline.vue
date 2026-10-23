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

type EventEntry = Extract<WorkspaceReviewEntry, { type: "event" }>;

// A timeline row: a comment on its own, or a run of consecutive events by the
// same actor collapsed into one compact line (opened · assigned · verified …),
// so the lifecycle metadata doesn't drown the discussion.
type TimelineRow =
	| { kind: "comment"; id: string; entry: CommentEntry }
	| { kind: "events"; id: string; items: EventEntry[] };

const rows = computed<TimelineRow[]>(() => {
	const out: TimelineRow[] = [];
	for (const entry of props.entries) {
		if (entry.type === "comment") {
			out.push({ kind: "comment", id: entry.id, entry });
			continue;
		}
		const prev = out.at(-1);
		// Merge into the previous event run when the same actor acted; otherwise a
		// new run. Actor absence (removed account) breaks the run.
		if (
			prev?.kind === "events" &&
			entry.actor &&
			prev.items[0]?.actor?.id === entry.actor.id
		) {
			prev.items.push(entry);
		} else {
			out.push({ kind: "events", id: entry.id, items: [entry] });
		}
	}
	return out;
});

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

    <ol v-else class="relative flex flex-col gap-3">
      <!-- One continuous rail behind every item, from the first marker's centre
           to the last's (markers are 24px, so ±12px). Markers sit on top with an
           opaque ring, so the line reads as unbroken (GitHub-style). -->
      <span
        v-if="rows.length > 1"
        aria-hidden="true"
        class="absolute left-3 top-3 bottom-3 w-px bg-border"
      />

      <li
        v-for="row in rows"
        :key="row.id"
        class="relative flex gap-3"
        :class="row.kind === 'events' ? 'items-center' : ''"
      >
        <!-- Comment: a full card that breaks out to the left of the rail (so it
             stands apart from the on-rail events), with the author avatar inside
             its header. -->
        <template v-if="row.kind === 'comment'">
          <div
            class="-ml-3 min-w-0 flex-1 rounded-lg border border-border/60 bg-background"
          >
            <div
              class="flex items-center gap-2 rounded-t-lg border-b border-border/60 bg-muted/30 px-3 py-2 text-sm"
            >
              <EntityAvatar
                size="sm"
                class="shrink-0"
                :name="personLabel(row.entry.author)"
                :src="resolveAvatarUrl(row.entry.author.avatarUrl)"
              />
              <span class="font-medium text-foreground">
                {{ personLabel(row.entry.author) }}
              </span>
              <span class="text-xs text-muted-foreground">
                {{ relativeTime(row.entry.createdAt) }}
              </span>
              <span v-if="isEdited(row.entry)" class="text-xs text-muted-foreground">
                · {{ t("reviews.detail.commentActions.edited") }}
              </span>
              <!-- Own-comment actions: edit (inline) + delete (confirm). -->
              <DropdownMenu
                v-if="
                  canManage(row.entry) &&
                  (onEditComment || onDeleteComment) &&
                  editingId !== row.entry.id
                "
              >
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="ml-auto size-6 shrink-0 text-muted-foreground"
                    :disabled="busyId === row.entry.id"
                    :aria-label="t('reviews.detail.commentActions.actions')"
                  >
                    <MoreHorizontal :size="15" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    v-if="onEditComment"
                    @select="startEdit(row.entry)"
                  >
                    <Pencil :size="14" />
                    {{ t("reviews.detail.commentActions.edit") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    v-if="onDeleteComment"
                    class="text-destructive focus:text-destructive"
                    @select="deletingEntry = row.entry"
                  >
                    <Trash2 :size="14" />
                    {{ t("reviews.detail.commentActions.delete") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <!-- Inline editor for this comment. -->
            <div v-if="editingId === row.entry.id" class="flex flex-col gap-2 p-3">
              <MentionInput
                v-model="editDraft"
                :candidates="mentionCandidates"
                :placeholder="t('reviews.detail.commentPlaceholder')"
                @submit="saveEdit(row.entry)"
              />
              <div class="flex justify-end gap-2">
                <Button variant="ghost" size="sm" @click="cancelEdit">
                  {{ t("common.cancel") }}
                </Button>
                <Button
                  size="sm"
                  :disabled="!editDraft.trim() || busyId === row.entry.id"
                  @click="saveEdit(row.entry)"
                >
                  <Loader2
                    v-if="busyId === row.entry.id"
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
                v-for="(seg, i) in bodySegments(row.entry.body)"
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

        <!-- Events: a run of lifecycle actions by one actor, collapsed into one
             quiet line (opened · assigned · verified …) so metadata recedes and
             comments lead. A smaller, muted marker carries the first action. -->
        <template v-else>
          <span
            class="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground"
          >
            <component :is="eventIcon(row.items[0]!.kind)" :size="12" />
          </span>
          <p class="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
            <span
              v-if="row.items[0]!.actor"
              class="font-medium text-foreground"
            >
              {{ personLabel(row.items[0]!.actor!) }}
            </span>
            <template v-for="(ev, j) in row.items" :key="ev.id">
              <span v-if="j > 0" aria-hidden="true" class="text-border">·</span>
              <span>{{ t(`reviews.detail.events.${ev.kind}`) }}</span>
              <span class="text-xs">{{ relativeTime(ev.createdAt) }}</span>
            </template>
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
