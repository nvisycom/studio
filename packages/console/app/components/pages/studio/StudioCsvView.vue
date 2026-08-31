<script setup lang="ts">
import { Table, WrapText } from "@lucide/vue";
import StudioCodeView from "./StudioCodeView.vue";
import StudioCsvTable from "./StudioCsvTable.vue";
import { Checkbox } from "#console/components/ui/checkbox";
import { Label } from "#console/components/ui/label";
import type { TextEntityView } from "#console/composables/useTextEntities";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * CSV preview: a table (default) or the raw syntax-highlighted text, with a
 * toggle and a header-row option. A studio view (see the shared contract in
 * `useStudioView`); it fetches its own content, runs the formatting/highlight
 * pipeline, and reports its loading `phase` to the host. Entities highlight in
 * both views.
 */
// Local interfaces (see the note in StudioDocxView on why the view contract is
// declared locally rather than imported as a macro generic). Mirrors the shared
// StudioViewProps/Emits in `useStudioView`.
interface Props {
	/** Blob object URL of the .csv file, or null when nothing is open. */
	contentUrl: string | null;
	/** Detected entities to highlight (byte-offset spans). */
	entities?: TextEntityView[];
	/** Currently focused entity id, for the ring + scroll-into-view. */
	activeEntityId?: string | null;
}
interface Emits {
	"focus-entity": [id: string];
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
}
const props = withDefaults(defineProps<Props>(), {
	entities: () => [],
	activeEntityId: null,
});

// Whether the first row is a header. Owned by the page (shared with the audit
// list so it labels rows the same way), so it's a two-way model.
const withHeaders = defineModel<boolean>("withHeaders", { default: true });

const emit = defineEmits<Emits>();

const { t } = useI18n();

// Read the CSV text from its blob URL; re-fetch when the file changes.
const {
	text: textContent,
	isLoading: isLoadingText,
	error: textError,
} = useBlobText(() => props.contentUrl);

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

// Report the loading phase to the host (which shows the single loader/error):
// downloading -> parsing -> ready, or error. The fetch + parse are synchronous
// enough here that `parsing` is brief; the phase still keeps the contract uniform.
watch(
	[() => props.contentUrl, isLoadingText, textError, textContent],
	([url, loading, error, text]) => {
		if (!url) emit("phase", { status: "idle" });
		else if (loading) emit("phase", { status: "downloading" });
		else if (error)
			emit("phase", {
				status: "error",
				message: t("studio.preview.textFailed"),
			});
		else if (text != null) emit("phase", { status: "ready" });
	},
	{ immediate: true },
);
</script>

<template>
  <!-- Loading and error are shown by the host, driven by the `phase` events
       above; render content once it's ready. -->
  <div v-if="!isLoadingText && !textError" class="mx-auto w-full space-y-3">
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

    <!-- Both views use the full width; the raw view keeps CSV rows on one line
         and scrolls horizontally, like the table, rather than wrapping. -->
    <StudioCsvTable
      v-if="showTable"
      :text="formatted.text"
      :with-headers="withHeaders"
      :entities="entities"
      :active-entity-id="activeEntityId"
      @focus-entity="emit('focus-entity', $event)"
    />
    <StudioCodeView
      v-else
      :lines="lines"
      :active-entity-id="activeEntityId"
      :wrap="false"
      @focus-entity="emit('focus-entity', $event)"
    />
  </div>
</template>
