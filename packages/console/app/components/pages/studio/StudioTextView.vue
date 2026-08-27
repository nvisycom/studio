<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import StudioCodeView from "./StudioCodeView.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { AddEntityInput } from "#console/composables/useStudioAudit";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";
import { useSelectionOffset } from "#console/composables/useSelectionOffset";
import { LabelSelect } from "#console/components/common";

/**
 * Preview for non-tabular text files (plain text, JSON, …) in the code view:
 * numbered gutter, syntax highlighting, and entity chips. Fetches its own
 * content and runs the formatting/highlight pipeline, so the parent just
 * branches on the file kind (parallel to StudioCsvView / StudioDocxView).
 * JSON is prettified + syntax-coloured; other text passes through highlighted.
 *
 * On unformatted files it also lets a reviewer select text and mark it as a new
 * entity to redact, emitting the byte-offset span + chosen label to the parent.
 */
const props = withDefaults(
	defineProps<{
		/** Blob object URL of the file, or null when nothing is open. */
		contentUrl: string | null;
		/** File extension (e.g. "json", "txt"), driving formatting. */
		fileKind: string;
		/** Detected entities to highlight (byte-offset spans). */
		entities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
		/** Whether the reviewer may add entities (the detection is complete). */
		canAdd?: boolean;
	}>(),
	{ entities: () => [], activeEntityId: null, canAdd: false },
);

const emit = defineEmits<{
	"focus-entity": [id: string];
	/** Mark a selected span as a new entity to redact (byte offsets + label). */
	"add-entity": [payload: AddEntityInput];
}>();

const { t } = useI18n();

// Read the text from its blob URL; re-fetch when the file changes.
const {
	text: textContent,
	isLoading: isLoadingText,
	error: textError,
} = useBlobText(() => props.contentUrl);

// Formatting + highlight pipeline: prettify (JSON), syntax tokens, byte→char and
// span reconciliation — yields the per-line coloured/flagged runs.
const { lines, canAddEntities, charToByte } = useDocumentSegments({
	text: textContent,
	entities: () => props.entities,
	fileKind: () => props.fileKind,
});

// Adding is offered only when the detection is complete AND the shown text is
// the raw file (unformatted) so selection offsets map to source bytes.
const addEnabled = computed(() => props.canAdd && canAddEntities.value);

// Text selection → document char offsets, for the "mark as sensitive" flow.
const codeContainer = ref<HTMLElement | null>(null);
const { selection, clear: clearSelection } = useSelectionOffset(codeContainer);

// The pending add: the selection captured when the popover opened, plus the
// label being chosen. Held separately so the popover survives the selection
// collapsing (clicking the label picker clears the browser selection).
const pending = ref<{ start: number; end: number; text: string } | null>(null);
const pendingLabel = ref("");

// Place a floating element just below a selection rect, in coordinates relative
// to the (positioned) code container. Used for both the trigger and the popover.
function anchorStyle(rect: DOMRect): { top: string; left: string } {
	const root = codeContainer.value;
	const box = root?.getBoundingClientRect();
	const top = rect.bottom - (box?.top ?? 0) + (root?.scrollTop ?? 0) + 6;
	const left = rect.left - (box?.left ?? 0) + (root?.scrollLeft ?? 0);
	return { top: `${top}px`, left: `${left}px` };
}

// The floating trigger tracks the live selection; the popover freezes at the
// position where it opened (its selection is captured into `pending`).
const triggerStyle = computed(() =>
	selection.value ? anchorStyle(selection.value.rect) : { top: "0", left: "0" },
);
const popoverStyle = ref<{ top: string; left: string }>({
	top: "0",
	left: "0",
});

// Open the "mark as sensitive" popover for the current selection.
function openAdd() {
	const sel = selection.value;
	if (!sel) return;
	popoverStyle.value = anchorStyle(sel.rect);
	pending.value = { start: sel.start, end: sel.end, text: sel.text };
	pendingLabel.value = "";
}

function cancelAdd() {
	pending.value = null;
	pendingLabel.value = "";
	clearSelection();
}

function confirmAdd() {
	const p = pending.value;
	if (!p || !pendingLabel.value) return;
	emit("add-entity", {
		byteStart: charToByte(p.start),
		byteEnd: charToByte(p.end),
		label: pendingLabel.value,
		text: p.text,
	});
	cancelAdd();
	window.getSelection()?.removeAllRanges();
}
</script>

<template>
  <div
    v-if="isLoadingText"
    class="flex flex-1 items-center justify-center text-muted-foreground"
  >
    <Loader2 :size="24" class="animate-spin" />
  </div>
  <div
    v-else-if="textError"
    class="flex flex-1 items-center justify-center text-center text-muted-foreground"
  >
    <p class="text-sm">{{ t("studio.preview.textFailed") }}</p>
  </div>
  <!-- Readable page width: long code/prose lines shouldn't run edge to edge. -->
  <div v-else class="mx-auto w-full max-w-[850px]">
    <div ref="codeContainer" class="relative">
      <StudioCodeView
        :lines="lines"
        :active-entity-id="activeEntityId"
        @focus-entity="emit('focus-entity', $event)"
      />

      <!-- Floating "mark as sensitive" trigger, shown while text is selected. -->
      <button
        v-if="addEnabled && selection && !pending"
        type="button"
        class="absolute z-10 flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md"
        :style="triggerStyle"
        @mousedown.prevent
        @click="openAdd"
      >
        {{ t("studio.audit.markSensitive") }}
      </button>

      <!-- Label-picker popover for the pending selection. -->
      <div
        v-if="pending"
        class="absolute z-20 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg"
        :style="popoverStyle"
      >
        <p class="mb-2 truncate font-mono text-xs text-muted-foreground">
          "{{ pending.text }}"
        </p>
        <LabelSelect
          v-model="pendingLabel"
          :placeholder="t('studio.audit.pickLabel')"
        />
        <div class="mt-3 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            @click="cancelAdd"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            type="button"
            class="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
            :disabled="!pendingLabel"
            @click="confirmAdd"
          >
            {{ t("studio.audit.addEntity") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
