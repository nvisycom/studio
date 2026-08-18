<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import StudioCodeView from "./StudioCodeView.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";

/**
 * Preview for non-tabular text files (plain text, JSON, …) in the code view:
 * numbered gutter, syntax highlighting, and entity chips. Fetches its own
 * content and runs the formatting/highlight pipeline, so the parent just
 * branches on the file kind (parallel to StudioCsvView / StudioDocxView).
 * JSON is prettified + syntax-coloured; other text passes through highlighted.
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
	}>(),
	{ entities: () => [], activeEntityId: null },
);

const emit = defineEmits<{ "focus-entity": [id: string] }>();

const { t } = useI18n();

// Read the text from its blob URL; re-fetch when the file changes.
const {
	text: textContent,
	isLoading: isLoadingText,
	error: textError,
} = useBlobText(() => props.contentUrl);

// Formatting + highlight pipeline: prettify (JSON), syntax tokens, byte→char and
// span reconciliation — yields the per-line coloured/flagged runs.
const { lines } = useDocumentSegments({
	text: textContent,
	entities: () => props.entities,
	fileKind: () => props.fileKind,
});
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
    <StudioCodeView
      :lines="lines"
      :active-entity-id="activeEntityId"
      @focus-entity="emit('focus-entity', $event)"
    />
  </div>
</template>
