<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";
import { EntityDetailPopover } from "#console/components/pages/studio";
import StudioCsvView from "./StudioCsvView.vue";
import StudioDocxView from "./StudioDocxView.vue";
import StudioImageView from "./StudioImageView.vue";
import StudioTextView from "./StudioTextView.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { AddEntityInput } from "#console/composables/useStudioAudit";

const props = withDefaults(
	defineProps<{
		contentUrl: string | null;
		displayName: string;
		/** The file's real extension (from the API), the source of truth for
		 * which sub-view renders — not parsed from the display name. */
		fileExtension: string;
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
		/** Whether the reviewer may add entities by selecting text (detection complete). */
		canAdd?: boolean;
	}>(),
	{ entities: () => [], activeEntityId: null, canAdd: false },
);

// Whether the CSV's first row is a header. Owned by the page so the audit list
// can label rows consistently; two-way so the toggle here updates it.
const withHeaders = defineModel<boolean>("withHeaders", { default: true });

const emit = defineEmits<{
	"zoom-in": [];
	"zoom-out": [];
	"toggle-chat": [];
	"focus-entity": [id: string];
	/** Clear the current entity selection (popover dismissed). */
	"clear-entity": [];
	/** A reviewer marked a text span as a new entity to redact. */
	"add-entity": [payload: AddEntityInput];
}>();

const { t } = useI18n();

// File kind drives which preview renders. Each kind has its own self-contained
// component (CSV, text/JSON, DOCX); this component dispatches between them. Keyed
// off the API's real extension, so a redacted `report.csv.redacted` still reads
// as CSV.
const fileKind = computed(() => props.fileExtension.toLowerCase());
const isCsv = computed(() => fileKind.value === "csv");

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
    <div
      class="h-full overflow-y-auto"
      :class="{ 'bg-muted': isText }"
    >
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
          <p class="text-sm font-normal">{{ t("studio.preview.emptyTitle") }}</p>
          <p class="text-xs mt-2">
            {{ t("studio.preview.emptyDescription") }}
          </p>
        </div>
      </div>

      <!-- Image file preview -->
      <StudioImageView
        v-else-if="isImage"
        :content-url="contentUrl"
        :display-name="displayName"
        :zoom-level="zoomLevel"
      />

      <!-- Word document preview (read-only, rendered client-side) -->
      <StudioDocxView
        v-else-if="isDocx"
        :content-url="contentUrl"
        :entities="entities"
        :active-entity-id="activeEntityId"
        :zoom-level="zoomLevel"
        @focus-entity="emit('focus-entity', $event)"
      />

      <!-- Text file preview: the content sits as a "page" (card) centered on the
           muted canvas (painted on the scroll container above), matching the DOCX
           preview's paper-on-canvas look. CSV has its own component (full width
           so its table can spread); other text/JSON renders in the code view. -->
      <div v-else-if="isText" class="flex min-h-full flex-col p-6">
        <StudioCsvView
          v-if="isCsv"
          :content-url="contentUrl"
          :entities="entities"
          :active-entity-id="activeEntityId"
          v-model:with-headers="withHeaders"
          @focus-entity="emit('focus-entity', $event)"
        />
        <StudioTextView
          v-else
          :content-url="contentUrl"
          :file-kind="fileKind"
          :entities="entities"
          :active-entity-id="activeEntityId"
          :can-add="canAdd"
          @focus-entity="emit('focus-entity', $event)"
          @add-entity="emit('add-entity', $event)"
        />
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
