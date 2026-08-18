<script setup lang="ts">
import { Loader2, Table, WrapText } from "@lucide/vue";
import StudioCodeView from "./StudioCodeView.vue";
import StudioCsvTable from "./StudioCsvTable.vue";
import { Checkbox } from "#console/components/ui/checkbox";
import { Label } from "#console/components/ui/label";
import type { TextEntityView } from "#console/composables/useTextEntities";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";

/**
 * CSV preview: a table (default) or the raw syntax-highlighted text, with a
 * toggle and a header-row option. Fetches its own content and runs the
 * formatting/highlight pipeline, so the parent just branches on the file kind
 * (parallel to StudioDocxView). Detected entities highlight in both views.
 */
const props = withDefaults(
	defineProps<{
		/** Blob object URL of the .csv file, or null when nothing is open. */
		contentUrl: string | null;
		/** Detected entities to highlight (byte-offset spans). */
		entities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
	}>(),
	{ entities: () => [], activeEntityId: null },
);

// Whether the first row is a header. Owned by the page (shared with the audit
// list so it labels rows the same way), so it's a two-way model.
const withHeaders = defineModel<boolean>("withHeaders", { default: true });

const emit = defineEmits<{ "focus-entity": [id: string] }>();

const { t } = useI18n();

// Read the CSV text from its blob URL; re-fetch when the file changes.
const textContent = ref<string | null>(null);
const isLoadingText = ref(false);
const textError = ref(false);

watch(
	() => props.contentUrl,
	async (url) => {
		textContent.value = null;
		textError.value = false;
		if (!url) return;
		isLoadingText.value = true;
		try {
			const response = await fetch(url);
			const text = await response.text();
			// Ignore a stale response if the file changed while the fetch was in flight.
			if (props.contentUrl === url) textContent.value = text;
		} catch {
			if (props.contentUrl === url) textError.value = true;
		} finally {
			if (props.contentUrl === url) isLoadingText.value = false;
		}
	},
	{ immediate: true },
);

// Table (default) or the raw highlighted text.
const view = ref<"table" | "raw">("table");
const showTable = computed(() => view.value === "table");

// Formatting + highlight pipeline (prettify, syntax tokens, byte→char and span
// reconciliation). Yields the formatted text and per-line coloured/flagged runs.
const { formatted, lines } = useDocumentSegments({
	text: textContent,
	entities: () => props.entities,
	fileKind: () => "csv",
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
  <div v-else class="mx-auto w-full space-y-3">
    <!-- Controls: table/raw toggle + header-row option -->
    <div class="flex items-center justify-between gap-3">
      <div class="inline-flex rounded-md border border-border/50 p-0.5">
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            showTable
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="view = 'table'"
        >
          <Table :size="14" /> {{ t("studio.preview.table") }}
        </button>
        <button
          type="button"
          class="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors"
          :class="
            !showTable
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="view = 'raw'"
        >
          <WrapText :size="14" /> {{ t("studio.preview.raw") }}
        </button>
      </div>
      <div v-if="showTable" class="flex items-center gap-2">
        <Checkbox id="csv-headers" v-model="withHeaders" />
        <Label
          for="csv-headers"
          class="cursor-pointer text-xs font-normal text-muted-foreground"
        >
          {{ t("studio.preview.withHeaders") }}
        </Label>
      </div>
    </div>

    <!-- Table uses the full width (columns spread); raw is just text, so it
         keeps a readable page width instead of stretching edge to edge. -->
    <StudioCsvTable
      v-if="showTable"
      :text="formatted.text"
      :with-headers="withHeaders"
      :entities="entities"
      :active-entity-id="activeEntityId"
      @focus-entity="emit('focus-entity', $event)"
    />
    <div v-else class="max-w-[850px]">
      <StudioCodeView
        :lines="lines"
        :active-entity-id="activeEntityId"
        @focus-entity="emit('focus-entity', $event)"
      />
    </div>
  </div>
</template>
