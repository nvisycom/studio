<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import StudioCodeView from "./StudioCodeView.vue";
import AddEntityPopover from "./AddEntityPopover.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type {
	AddEntityInput,
	PendingAdd,
} from "#console/composables/useStudioAudit";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";
import { useSelectionOffset } from "#console/composables/useSelectionOffset";

/**
 * Preview for non-tabular text files (plain text, JSON, …) in the code view:
 * numbered gutter, syntax highlighting, and entity chips. Fetches its own
 * content and runs the formatting/highlight pipeline, so the parent just
 * branches on the file kind (parallel to StudioCsvView / StudioDocxView).
 * JSON is prettified + syntax-coloured; other text passes through highlighted.
 *
 * On a complete detection it also lets a reviewer select text and add it as a
 * new entity to redact (a detail-style popover), emitting the byte-offset span
 * + chosen label to the parent.
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
const { resolveLabel } = useLabels();

// The catalog's generic "unresolved entity" label — a stable builtin id — used
// as the default for a reviewer-added span, so a quick add doesn't force a label
// choice. Only defaulted to when the deployment's catalog actually has it.
const DEFAULT_ADD_LABEL = "unresolved";

// Read the text from its blob URL; re-fetch when the file changes.
const {
	text: textContent,
	isLoading: isLoadingText,
	error: textError,
} = useBlobText(() => props.contentUrl);

// The pending add: the selection frozen when the popover opened — its byte span
// (for the redaction edit + the document highlight), its text and rect (for the
// popover). Frozen so the popover survives the browser selection collapsing when
// the reviewer clicks the label picker.
const pending = ref<PendingAdd | null>(null);
const pendingLabel = ref("");

// While the popover is open, highlight the pending span with the same chip
// treatment (a distinct `pending` category) so the reviewer keeps seeing what
// they're about to add after the browser selection clears.
const pendingEntity = computed<TextEntityView[]>(() =>
	pending.value
		? [
				{
					id: "__pending__",
					modality: "text",
					label: "",
					category: "pending",
					start: pending.value.byteStart,
					end: pending.value.byteEnd,
					confidence: 1,
				},
			]
		: [],
);

// Formatting + highlight pipeline: prettify (JSON), syntax tokens, byte→char and
// span reconciliation — yields the per-line coloured/flagged runs.
const { lines, canAddEntities, charRangeToBytes } = useDocumentSegments({
	text: textContent,
	entities: () => [...props.entities, ...pendingEntity.value],
	fileKind: () => props.fileKind,
});

// Adding is offered only once the detection is complete and the file supports
// mapping a selection back to source bytes (plain text + JSON; see the segments
// composable). CSV/DOCX exclude it.
const addEnabled = computed(() => props.canAdd && canAddEntities.value);

// Text selection → document char offsets, for the add-entity flow.
const codeContainer = ref<HTMLElement | null>(null);
const { selection, clear: clearSelection } = useSelectionOffset(codeContainer);

// Open the add popover when the reviewer selects text (once addable). Convert the
// selection to byte offsets and freeze it, then clear the native browser
// selection: our own `pending` chip marks the span, so the blue selection doesn't
// linger and compete with it.
watch(selection, (sel) => {
	if (!addEnabled.value || !sel) return;
	pending.value = {
		...charRangeToBytes(sel.start, sel.end),
		text: sel.text,
		rect: sel.rect,
	};
	// Default to "unresolved entity" when the catalog has it, else leave blank.
	pendingLabel.value = resolveLabel(DEFAULT_ADD_LABEL) ? DEFAULT_ADD_LABEL : "";
	window.getSelection()?.removeAllRanges();
});

function cancelAdd() {
	pending.value = null;
	pendingLabel.value = "";
	clearSelection();
	window.getSelection()?.removeAllRanges();
}

function confirmAdd() {
	const p = pending.value;
	if (!p || !pendingLabel.value) return;
	emit("add-entity", {
		byteStart: p.byteStart,
		byteEnd: p.byteEnd,
		label: pendingLabel.value,
		text: p.text,
	});
	cancelAdd();
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
  <div v-else ref="codeContainer" class="mx-auto w-full max-w-[850px]">
    <StudioCodeView
      :lines="lines"
      :active-entity-id="activeEntityId"
      @focus-entity="emit('focus-entity', $event)"
    />

    <!-- Add a missed entity: a detail-style card below the text selection. -->
    <AddEntityPopover
      v-model:label="pendingLabel"
      :pending="pending"
      @confirm="confirmAdd"
      @cancel="cancelAdd"
    />
  </div>
</template>
