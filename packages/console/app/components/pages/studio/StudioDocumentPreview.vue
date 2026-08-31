<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";
import { EntityDetailPopover } from "#console/components/pages/studio";
import { rendererFor } from "./renderers";
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

// File kind drives which preview renders. Each format family has a self-contained
// view component, registered in the renderer registry (the single source of truth
// for extension -> handler); this component looks the renderer up by the API's
// real extension and dispatches to its lazily-loaded component via `<component
// :is>`. Keyed off `fileExtension`, so a redacted `report.csv.redacted` (whose
// `fileExtension` stays `csv`) still resolves to the CSV renderer.
const fileKind = computed(() => props.fileExtension.toLowerCase());
const renderer = computed(() => rendererFor(props.fileExtension) ?? null);

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

// The renderer's view as an async component, rebuilt when the resolved renderer
// changes (a different format opened). Wrapping the registry's lazy loader here
// (rather than in the registry) lets a *chunk load failure* — a network blip
// fetching the code-split view — surface through the same error phase as any
// other load failure, instead of leaving the host loader spinning forever. The
// host already shows its single loader while the chunk fetches (viewPhase starts
// `downloading`), so no per-renderer loading component is needed.
const asyncView = computed(() => {
	const active = renderer.value;
	if (!active) return null;
	return defineAsyncComponent({
		loader: active.component,
		onError(error, _retry, fail) {
			viewPhase.value = {
				status: "error",
				message: getErrorMessage(error, t("studio.preview.textFailed")),
			};
			// Record the failure as an error phase (host shows it) and stop here —
			// don't retry or rethrow, which would bubble as an unhandled render error.
			fail();
		},
	});
});

// The common contract every renderer accepts (a superset — a view ignores the
// props it doesn't declare). View-specific extras (`displayName`, `zoomLevel`,
// `fileKind`, and the CSV `withHeaders` v-model pair) are folded in per renderer
// below.
const commonProps = computed(() => ({
	contentUrl: props.contentUrl,
	entities: props.entities,
	activeEntityId: props.activeEntityId,
	canAdd: props.canAdd,
}));
// Per-kind extra props, keyed by the resolved renderer. Only the handful of views
// that need more than the common set appear here; everything else gets the common
// set alone. The CSV view's `with-headers` v-model is threaded as an explicit
// prop + `onUpdate` here (rather than a template `v-model`) so the generic
// `<component :is>` doesn't leak a stray `with-headers` attr onto other views.
const rendererProps = computed<Record<string, unknown>>(() => {
	const base = commonProps.value;
	switch (renderer.value?.kind) {
		case "image":
			return {
				...base,
				displayName: props.displayName,
				zoomLevel: props.zoomLevel,
			};
		case "csv":
			return {
				...base,
				withHeaders: withHeaders.value,
				"onUpdate:withHeaders": (v: boolean) => {
					withHeaders.value = v;
				},
			};
		case "text":
			return { ...base, fileKind: fileKind.value };
		default:
			return base;
	}
});

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

      <!-- The active file's preview: the registry resolves its renderer by the
           file's real extension and this dispatches to that renderer's lazily
           loaded component. Every view takes the shared contentUrl + entity/phase
           contract (bound via `rendererProps` + the common emit listeners); the
           per-kind wrapper class supplies the "paper on canvas" padding the
           text/CSV views expect (image/DOCX lay out edge-to-edge). Rendered behind
           the loading overlay so a view can initialize underneath it (e.g.
           SuperDoc) and the overlay clears when the view reports `ready`. -->
      <div
        v-else-if="!isLoading && contentUrl && renderer && asyncView"
        :class="renderer.wrapperClass"
      >
        <component
          :is="asyncView"
          v-bind="rendererProps"
          @focus-entity="emit('focus-entity', $event)"
          @add-entity="emit('add-entity', $event)"
          @phase="viewPhase = $event"
        />
      </div>

      <!-- Unsupported file type: a file whose extension no renderer handles. -->
      <div
        v-else-if="!isLoading && contentUrl"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-normal">{{ displayName }}</p>
          <p class="text-xs mt-2">
            {{ t("studio.preview.unsupported") }}
          </p>
        </div>
      </div>
    </div>

    <!-- Zoom Controls. A renderer with its own zoom (DOCX/SuperDoc) opts out via
         the registry, so the generic zoom pill is hidden for it — the chat toggle
         stays. -->
    <ZoomControls
      :zoom-level="zoomLevel"
      :chat-visible="chatVisible"
      :show-zoom="renderer?.supportsZoom ?? false"
      @zoom-in="emit('zoom-in')"
      @zoom-out="emit('zoom-out')"
      @toggle-chat="emit('toggle-chat')"
    />
  </div>
</template>
