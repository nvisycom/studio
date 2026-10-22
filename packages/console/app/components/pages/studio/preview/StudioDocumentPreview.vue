<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import EntityDetailPopover from "../entities/EntityDetailPopover.vue";
import { rendererFor } from "./renderers";
import type { AudioTranscriptState } from "./StudioAudioView.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { ImageEntityView } from "#console/composables/useImageEntities";
import type { AudioEntityView } from "#console/composables/useAudioEntities";
import type { ImageLayout } from "#console/composables/useImageLayout";
import type {
	AddTextEntityInput,
	AddImageEntityInput,
	AddAudioEntityInput,
} from "#console/composables/useStudioRedaction";
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
		/** Detected + added text/tabular entities, forwarded to the text/DOCX/CSV
		 * views. Named by modality to match `imageEntities` / `audioEntities`. */
		textEntities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
		/** Whether the reviewer may add entities by selecting text (detection complete). */
		canAdd?: boolean;
		/** The active audio file's transcript state (from detection intermediates),
		 * forwarded to the audio view. Defaults to hidden (no completed detection). */
		audioTranscriptState?: AudioTranscriptState;
		/** Detected image entities (bounding boxes), forwarded to the image view. */
		imageEntities?: ImageEntityView[];
		/** OCR layout for the image view's optional overlay, when available. */
		imageOcr?: ImageLayout | null;
		/** Detected + added audio entities (time spans), forwarded to the audio view. */
		audioEntities?: AudioEntityView[];
	}>(),
	{
		textEntities: () => [],
		activeEntityId: null,
		canAdd: false,
		audioTranscriptState: () => ({ kind: "hidden" }),
		imageEntities: () => [],
		imageOcr: null,
		audioEntities: () => [],
	},
);

// Whether the CSV's first row is a header. Owned by the page so the audit list
// can label rows consistently; two-way so the toggle here updates it.
const withHeaders = defineModel<boolean>("withHeaders", { default: true });

const emit = defineEmits<{
	"focus-entity": [id: string];
	/** Clear the current entity selection (popover dismissed). */
	"clear-entity": [];
	/** A reviewer marked a text span as a new entity to redact (text/DOCX/CSV). */
	"add-text-entity": [payload: AddTextEntityInput];
	/** A reviewer drew a box marking a new image region to redact. */
	"add-image-entity": [payload: AddImageEntityInput];
	/** A reviewer selected a waveform span marking a new audio entity to redact. */
	"add-audio-entity": [payload: AddAudioEntityInput];
	/** A reviewer dragged an audio entity region's edge — correct its span. */
	"retag-audio-span": [id: string, span: { start: number; end: number }];
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
			// A loader promise isn't cancelled when its component unmounts, so an old
			// renderer's chunk can still reject after a different file has opened —
			// only surface the failure if this loader's renderer is still the active
			// one, or a stale error would clobber the new view's phase.
			if (renderer.value === active) {
				viewPhase.value = {
					status: "error",
					message: getErrorMessage(error, t("studio.preview.textFailed")),
				};
			}
			// Stop here regardless — don't retry or rethrow, which would bubble as an
			// unhandled render error.
			fail();
		},
	});
});

// The common contract every renderer accepts (a superset — a view ignores the
// props it doesn't declare). View-specific extras (`displayName`, `fileKind`, and
// the CSV `withHeaders` v-model pair) are folded in per renderer below. Zoom is
// each zooming view's own concern (image, audio) — there's no shared zoom prop.
const commonProps = computed(() => ({
	contentUrl: props.contentUrl,
	// The views' own prop is `entities` (each is single-modality); the image/audio
	// cases below override it with their modality's entities.
	entities: props.textEntities,
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
				entities: props.imageEntities,
				ocr: props.imageOcr,
			};
		case "audio":
			return {
				...base,
				displayName: props.displayName,
				transcriptState: props.audioTranscriptState,
				entities: props.audioEntities,
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

// The focused entity object, for the detail popover. (Text/tabular only — the
// keep/redact detail card is the text overlay's; image/audio focus is handled in
// their own views.)
const activeEntity = computed(
	() => props.textEntities.find((e) => e.id === props.activeEntityId) ?? null,
);

// Anchor the detail popover to the focused entity's chip. The chip may live in
// any preview, so it's queried from the preview root.
const rootEl = ref<HTMLElement | null>(null);

// Locate the on-screen chip for an entity. The previews mark it two ways: most
// (code, CSV, PDF) set `data-entity`, while the DOCX overlay (SuperDoc decoration
// spans) carries a `docx-eid-<id>` class instead. Query both so every view
// anchors. A DOCX run can hold several ids (overlapping entities); the class
// selector matches any of them.
function findChip(id: string): HTMLElement | null {
	const escaped = CSS.escape(id);
	return (
		rootEl.value?.querySelector<HTMLElement>(
			`[data-entity="${escaped}"], .docx-eid-${escaped}`,
		) ?? null
	);
}

// The anchor is a VIRTUAL element, not a captured chip node: the views recreate
// their chip elements on every re-highlight (a DOCX keep toggle, a PDF repaint),
// which would detach a captured node and snap the popover to the top-left corner.
// Re-querying the live chip inside `getBoundingClientRect` — which the floating
// layer calls on every reposition — keeps the popover pinned to whatever chip is
// currently on screen, surviving those rebuilds.
const activeChipEl = computed<{ getBoundingClientRect(): DOMRect } | null>(
	() => {
		const id = props.activeEntityId;
		if (!id) return null;
		// The floating layer measures the anchor only on scroll/resize, not every
		// frame, and the chip can be gone at that moment — a DOCX decoration renders
		// only while its range is in view, so scrolling it off removes the node.
		// Returning a zero rect then would pin the open popover to the viewport's
		// top-left until the next scroll; instead keep returning the last real rect.
		let lastRect = new DOMRect(0, 0, 0, 0);
		return {
			getBoundingClientRect: () => {
				const chip = findChip(id);
				if (chip) lastRect = chip.getBoundingClientRect();
				return lastRect;
			},
		};
	},
);

// Scroll the newly focused chip into view on a focus change (not on a rebuild).
// The popover anchors to the chip's *current* on-screen rect, so the chip has to
// be in view before the floating layer measures it — otherwise the popover is
// positioned off-screen (an entity that needed scrolling shows no popover) or
// against the pre-scroll rect (it lands detached from the chip). Scroll it in
// synchronously (`instant`, no smooth-scroll race), then prompt a reposition: the
// floating layer re-reads the anchor on window scroll/resize, and the virtual
// anchor now returns the settled rect.
watch(
	() => props.activeEntityId,
	(id) => {
		if (!id) return;
		nextTick(() => {
			if (props.activeEntityId !== id) return;
			const chip = findChip(id);
			if (!chip) return;
			chip.scrollIntoView({ block: "center", behavior: "instant" });
			// After layout settles, nudge the floating layer to re-measure against
			// the chip's new position.
			requestAnimationFrame(() => {
				window.dispatchEvent(new Event("resize"));
			});
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
          @add-text-entity="emit('add-text-entity', $event)"
          @add-image-entity="emit('add-image-entity', $event)"
          @add-audio-entity="emit('add-audio-entity', $event)"
          @retag-audio-span="
            (id: string, span: { start: number; end: number }) =>
              emit('retag-audio-span', id, span)
          "
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
  </div>
</template>
