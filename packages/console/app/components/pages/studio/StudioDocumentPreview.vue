<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";
import { EntityDetailPopover } from "#console/components/pages/studio";
import StudioCsvView from "./StudioCsvView.vue";
import StudioDocxView from "./StudioDocxView.vue";
import StudioImageView from "./StudioImageView.vue";
import StudioTextView from "./StudioTextView.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { AddEntityInput } from "#console/composables/useStudioRedaction";
import {
	type StudioViewPhase,
	isViewLoading,
} from "#console/composables/useStudioView";

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
	/** Keep/redact toggle for an entity (from its detail popover). */
	"toggle-suppress": [id: string];
}>();

const { t } = useI18n();

// File kind drives which preview renders. Each kind has its own self-contained
// component (CSV, text/JSON, DOCX); this component dispatches between them. Keyed
// off the API's real extension, so a redacted `report.csv.redacted` still reads
// as CSV.
const fileKind = computed(() => props.fileExtension.toLowerCase());
const isCsv = computed(() => fileKind.value === "csv");

// The active view reports its own loading phase (download -> parse/render ->
// ready | error), so the host shows ONE loader/error for every file kind instead
// of each view drawing its own. It starts optimistic (`downloading`) whenever a
// file opens, so the loader shows immediately before the view has mounted/emitted.
const viewPhase = ref<StudioViewPhase>({ status: "idle" });
watch(
	() => props.contentUrl,
	(url) => {
		viewPhase.value = { status: url ? "downloading" : "idle" };
	},
	{ immediate: true },
);

// Show the single loader while the file is fetching (`isLoading` from the page)
// or the active view is still working. Its copy follows the phase.
const showLoading = computed(
	() => props.isLoading || isViewLoading(viewPhase.value),
);
const loadingMessage = computed(() => {
	switch (viewPhase.value.status) {
		case "parsing":
			return t("studio.preview.parsing");
		case "rendering":
			return t("studio.preview.rendering");
		default:
			return t("studio.preview.loading");
	}
});
// A view that failed to load — the host shows the error in place of the content.
const viewError = computed(() =>
	!props.isLoading && viewPhase.value.status === "error"
		? (viewPhase.value.message ?? t("studio.preview.textFailed"))
		: null,
);

// The focused entity object, for the detail popover.
const activeEntity = computed(
	() => props.entities.find((e) => e.id === props.activeEntityId) ?? null,
);

// Scroll the focused entity into view and anchor the detail popover to its
// chip. The chip may live in the code view or the CSV table, so query from the
// preview root.
const rootEl = ref<HTMLElement | null>(null);
const activeChipEl = ref<HTMLElement | null>(null);

// Re-resolve the anchor chip for the active entity. Split from the watch so it
// can run both when the focus changes and when the highlights rebuild: the DOCX
// view recreates its chip elements on every re-highlight (e.g. after a keep
// toggle), which detaches the previously-captured node — leaving the popover
// anchored to a stale element, so it snaps to the top-left corner. Re-querying
// keeps it pinned to the live chip. `scroll` is only for a focus change.
function reanchor(scroll: boolean) {
	const id = props.activeEntityId;
	if (!id) {
		activeChipEl.value = null;
		return;
	}
	nextTick(() => {
		if (props.activeEntityId !== id) return;
		const el = rootEl.value?.querySelector<HTMLElement>(
			`[data-entity="${id}"]`,
		);
		activeChipEl.value = el ?? null;
		if (scroll) el?.scrollIntoView({ block: "center", behavior: "smooth" });
	});
}

// On focus change: re-anchor and scroll the newly focused chip into view.
watch(
	() => props.activeEntityId,
	() => reanchor(true),
);
// On highlight rebuild (entity set / suppressed state changed): re-anchor without
// scrolling, so a keep toggle doesn't leave the popover pinned to a dead node.
watch(
	() => props.entities,
	() => reanchor(false),
	{ deep: true },
);
</script>

<template>
  <div ref="rootEl" class="h-full overflow-hidden relative">
    <EntityDetailPopover
      :entity="activeEntity"
      :reference="activeChipEl"
      :with-headers="withHeaders"
      @close="emit('clear-entity')"
      @toggle-suppress="emit('toggle-suppress', $event)"
    />
    <div class="h-full overflow-y-auto">
      <!-- Single loading overlay for every file kind, driven by the active
           view's reported phase. Rendered as an overlay (not v-if against the
           views) so a view can mount and work *underneath* it (e.g. SuperDoc
           initializing), and it stays until the view reports `ready`. -->
      <div
        v-if="showLoading"
        class="absolute inset-0 z-20 flex items-center justify-center bg-background"
      >
        <div class="text-center text-muted-foreground">
          <Loader2 :size="32" class="mx-auto mb-3 animate-spin" />
          <p class="text-sm font-normal">{{ loadingMessage }}</p>
        </div>
      </div>

      <!-- Single error overlay, driven by the active view's `error` phase. -->
      <div
        v-else-if="viewError"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-6 text-center bg-background"
      >
        <FileText :size="32" class="text-muted-foreground opacity-40" />
        <p class="text-sm text-muted-foreground">{{ viewError }}</p>
      </div>

      <!-- No file selected state -->
      <div
        v-if="!isLoading && !contentUrl"
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
        v-else-if="!isLoading && isImage"
        :content-url="contentUrl"
        :display-name="displayName"
        :zoom-level="zoomLevel"
        @phase="viewPhase = $event"
      />

      <!-- Word document preview (read-only, rendered client-side). Rendered as
           soon as the bytes are available (behind the loading overlay), so
           SuperDoc's own loader is never seen — the overlay clears when the view
           reports `ready`. -->
      <StudioDocxView
        v-else-if="!isLoading && isDocx"
        :content-url="contentUrl"
        :entities="entities"
        :active-entity-id="activeEntityId"
        :can-add="canAdd"
        @focus-entity="emit('focus-entity', $event)"
        @add-entity="emit('add-entity', $event)"
        @phase="viewPhase = $event"
      />

      <!-- Text file preview: the content sits as a "page" (card) centered on the
           muted canvas (painted on the scroll container above), matching the DOCX
           preview's paper-on-canvas look. CSV has its own component (full width
           so its table can spread); other text/JSON renders in the code view. -->
      <div v-else-if="!isLoading && isText" class="flex min-h-full flex-col p-6">
        <StudioCsvView
          v-if="isCsv"
          :content-url="contentUrl"
          :entities="entities"
          :active-entity-id="activeEntityId"
          v-model:with-headers="withHeaders"
          @focus-entity="emit('focus-entity', $event)"
          @phase="viewPhase = $event"
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
          @phase="viewPhase = $event"
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

    <!-- Zoom Controls. DOCX manages its own zoom (SuperDoc), so hide the zoom
         pill for it — the chat toggle stays. -->
    <ZoomControls
      :zoom-level="zoomLevel"
      :chat-visible="chatVisible"
      :show-zoom="!isDocx"
      @zoom-in="emit('zoom-in')"
      @zoom-out="emit('zoom-out')"
      @toggle-chat="emit('toggle-chat')"
    />
  </div>
</template>
