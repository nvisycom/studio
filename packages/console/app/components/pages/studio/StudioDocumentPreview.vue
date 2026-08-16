<script setup lang="ts">
import { FileText, Loader2, Table, WrapText } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";
import {
	EntityDetailPopover,
	StudioCodeView,
	StudioCsvTable,
} from "#console/components/pages/studio";
import StudioDocxView from "./StudioDocxView.vue";
import { Checkbox } from "#console/components/ui/checkbox";
import { Label } from "#console/components/ui/label";
import type { TextEntityView } from "#console/composables/useTextEntities";
import { useDocumentSegments } from "#console/composables/useDocumentSegments";
import { getFileExtension } from "#console/utils/file";

const props = withDefaults(
	defineProps<{
		contentUrl: string | null;
		displayName: string;
		isLoading: boolean;
		isImage: boolean;
		isText: boolean;
		isDocx: boolean;
		zoomLevel: number;
		chatVisible: boolean;
		/** Detected entities to highlight in the text (byte-offset spans). */
		entities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
	}>(),
	{ entities: () => [], activeEntityId: null },
);

// Whether the CSV's first row is a header. Owned by the page so the audit list
// can label rows consistently; two-way so the toggle here updates it.
const withHeaders = defineModel<boolean>("withHeaders", { default: true });

// CSV can render as a table (default) or the raw highlighted text.
const csvView = ref<"table" | "raw">("table");

const emit = defineEmits<{
	"zoom-in": [];
	"zoom-out": [];
	"toggle-chat": [];
	"focus-entity": [id: string];
	/** Clear the current entity selection (popover dismissed). */
	"clear-entity": [];
}>();

const { t } = useI18n();

// Text preview: the content URL is a blob object URL, so read its text and
// render it in a <pre>. Re-fetch whenever the file (URL) changes.
const textContent = ref<string | null>(null);
const isLoadingText = ref(false);
const textError = ref(false);

watch(
	() => [props.contentUrl, props.isText] as const,
	async ([url, isText]) => {
		textContent.value = null;
		textError.value = false;
		if (!url || !isText) return;
		isLoadingText.value = true;
		try {
			const response = await fetch(url);
			textContent.value = await response.text();
		} catch {
			textError.value = true;
		} finally {
			isLoadingText.value = false;
		}
	},
	{ immediate: true },
);

// File kind drives the renderer + formatting.
const fileKind = computed(() => getFileExtension(props.displayName));
const isCsv = computed(() => fileKind.value === "csv");
const showCsvTable = computed(() => isCsv.value && csvView.value === "table");

// The formatting + highlight pipeline (prettify, syntax tokens, byte→char and
// span reconciliation) lives in a composable so this component stays about view
// state. It yields the formatted text and the per-line coloured/flagged runs.
const { formatted, lines } = useDocumentSegments({
	text: textContent,
	entities: () => props.entities,
	fileKind,
});

// The focused entity object, for the detail popover.
const activeEntity = computed(
	() => props.entities.find((e) => e.id === props.activeEntityId) ?? null,
);

// Scroll the focused entity into view and anchor the detail popover to its
// chip. The chip may live in the code view or the CSV table, so query from the
// preview root.
const rootEl = ref<HTMLElement | null>(null);
const activeChipEl = ref<HTMLElement | null>(null);
watch(
	() => props.activeEntityId,
	(id) => {
		if (!id) {
			activeChipEl.value = null;
			return;
		}
		nextTick(() => {
			const el = rootEl.value?.querySelector<HTMLElement>(
				`[data-entity="${id}"]`,
			);
			activeChipEl.value = el ?? null;
			el?.scrollIntoView({ block: "center", behavior: "smooth" });
		});
	},
);
</script>

<template>
  <div ref="rootEl" class="h-full overflow-hidden relative">
    <EntityDetailPopover
      :entity="activeEntity"
      :reference="activeChipEl"
      :with-headers="withHeaders"
      @close="emit('clear-entity')"
    />
    <div class="h-full overflow-y-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <Loader2 :size="32" class="mx-auto mb-3 animate-spin" />
          <p class="text-sm font-normal">Loading document...</p>
        </div>
      </div>

      <!-- No file selected state -->
      <div
        v-else-if="!contentUrl"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-normal">No document selected</p>
          <p class="text-xs mt-2">
            Select a file from the Files page to preview
          </p>
        </div>
      </div>

      <!-- Image file preview -->
      <div v-else-if="isImage" class="flex flex-col items-center gap-4 py-6">
        <div
          class="flex-shrink-0 shadow-lg"
          :style="{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }"
        >
          <img
            :src="contentUrl"
            :alt="displayName"
            class="max-w-[800px] bg-white"
          />
        </div>
      </div>

      <!-- Word document preview (read-only, rendered client-side) -->
      <StudioDocxView v-else-if="isDocx" :content-url="contentUrl" />

      <!-- Text file preview -->
      <div v-else-if="isText" class="min-h-full p-4">
        <div
          v-if="isLoadingText"
          class="h-full flex items-center justify-center text-muted-foreground"
        >
          <Loader2 :size="24" class="animate-spin" />
        </div>
        <div
          v-else-if="textError"
          class="h-full flex items-center justify-center text-center text-muted-foreground"
        >
          <p class="text-sm">Unable to load this file.</p>
        </div>
        <div v-else class="space-y-3">
          <!-- CSV controls: table/raw toggle + header-row option -->
          <div
            v-if="isCsv"
            class="flex items-center justify-between gap-3"
          >
            <div class="inline-flex rounded-md border border-border/50 p-0.5">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors"
                :class="
                  csvView === 'table'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="csvView = 'table'"
              >
                <Table :size="14" /> {{ t("studio.preview.table") }}
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors"
                :class="
                  csvView === 'raw'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                "
                @click="csvView = 'raw'"
              >
                <WrapText :size="14" /> {{ t("studio.preview.raw") }}
              </button>
            </div>
            <div v-if="csvView === 'table'" class="flex items-center gap-2">
              <Checkbox id="csv-headers" v-model="withHeaders" />
              <Label
                for="csv-headers"
                class="cursor-pointer text-xs font-normal text-muted-foreground"
              >
                {{ t("studio.preview.withHeaders") }}
              </Label>
            </div>
          </div>

          <!-- CSV table view -->
          <StudioCsvTable
            v-if="showCsvTable"
            :text="formatted.text"
            :with-headers="withHeaders"
            :entities="entities"
            :active-entity-id="activeEntityId"
            @focus-entity="emit('focus-entity', $event)"
          />

          <!-- Raw / code text view -->
          <StudioCodeView
            v-else
            :lines="lines"
            :active-entity-id="activeEntityId"
            @focus-entity="emit('focus-entity', $event)"
          />
        </div>
      </div>

      <!-- Unsupported file type -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-normal">{{ displayName }}</p>
          <p class="text-xs mt-2">
            This file type is not supported for preview
          </p>
        </div>
      </div>
    </div>

    <!-- Zoom Controls -->
    <ZoomControls
      :zoom-level="zoomLevel"
      :chat-visible="chatVisible"
      @zoom-in="emit('zoom-in')"
      @zoom-out="emit('zoom-out')"
      @toggle-chat="emit('toggle-chat')"
    />
  </div>
</template>
