<script setup lang="ts">
import { ScanText, ZoomIn } from "@lucide/vue";
import AddEntityHint from "./AddEntityHint.vue";
import AddEntityPopover from "./AddEntityPopover.vue";
import type { ImageEntityView } from "#console/composables/useImageEntities";
import type { ImageLayout } from "#console/composables/useImageLayout";
import type { AddImageEntityInput } from "#console/composables/useStudioRedaction";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * Image preview: the file at an adjustable zoom, with detected-entity bounding
 * boxes overlaid (on by default) and an optional OCR-layout overlay (toggle). A
 * studio view (see the shared contract in `useStudioView`); it reports its loading
 * `phase` off the `<img>` load/error events. Zoom is owned here (an inline slider).
 *
 * Boxes are positioned as a percentage of the image's *natural* size, so they
 * track the image correctly as zoom resizes it (zoom drives the image `width`,
 * not a transform) without recomputing.
 */
// Local interfaces (see the note in StudioDocxView on why the view contract is
// declared locally).
interface Props {
	/** Blob object URL of the image, or null when nothing is open. */
	contentUrl: string | null;
	/** File name, used as the image alt text. */
	displayName?: string;
	/** Detected entities to overlay as bounding boxes (each with its box + category). */
	entities?: ImageEntityView[];
	/** Currently focused entity id, for the active ring. */
	activeEntityId?: string | null;
	/** OCR layout (blocks/words with boxes) for the optional overlay, when available. */
	ocr?: ImageLayout | null;
	/** Whether the reviewer may add entities by drawing a box (detection complete). */
	canAdd?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
	entities: () => [],
	activeEntityId: null,
	ocr: null,
	canAdd: false,
});

const emit = defineEmits<{
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
	/** A box was clicked — focus that entity (cross-highlight with the audit list). */
	"focus-entity": [id: string];
	/** A reviewer drew a box marking a new image region to redact. */
	"add-image-entity": [payload: AddImageEntityInput];
}>();

const { t } = useI18n();

// The positioned image box element (image + overlays), for pointer→coordinate math
// and scrolling a focused entity into view.
const container = ref<HTMLElement | null>(null);

// Zoom as a percentage (100 = actual size); the slider drives it directly.
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const zoom = ref(100);

function onZoomInput(event: Event) {
	zoom.value = Number((event.target as HTMLInputElement).value);
}

// Whether the OCR-layout overlay is shown (off by default; only meaningful when
// OCR is available). Reset to off if OCR goes away (e.g. switching to a file with
// none), so the toggle can't stay stuck on.
const showOcr = ref(false);
const hasOcr = computed(() => (props.ocr?.blocks.length ?? 0) > 0);
watch(hasOcr, (available) => {
	if (!available) showOcr.value = false;
});

// When an entity is focused (e.g. from the audit list), scroll its box into view —
// parity with the text/audio views. A box zoomed off-screen would otherwise just
// gain the active ring invisibly. `nextTick` so a box that just mounted is queried.
watch(
	() => props.activeEntityId,
	(id) => {
		if (!id) return;
		nextTick(() => {
			container.value
				?.querySelector<HTMLElement>(`[data-entity-id="${CSS.escape(id)}"]`)
				?.scrollIntoView({
					block: "center",
					inline: "center",
					behavior: "smooth",
				});
		});
	},
);

// Natural image size (px), captured on load, to convert pixel boxes to percent.
const natural = ref<{ w: number; h: number } | null>(null);
function onImgLoad(event: Event) {
	const img = event.target as HTMLImageElement;
	natural.value = { w: img.naturalWidth, h: img.naturalHeight };
	emit("phase", { status: "ready" });
}

/** A pixel bounding box positioned as CSS percentages of the natural image size. */
function boxStyle(minX: number, minY: number, maxX: number, maxY: number) {
	const n = natural.value;
	if (!n || n.w === 0 || n.h === 0) return { display: "none" };
	return {
		left: `${(minX / n.w) * 100}%`,
		top: `${(minY / n.h) * 100}%`,
		width: `${((maxX - minX) / n.w) * 100}%`,
		height: `${((maxY - minY) / n.h) * 100}%`,
	};
}

// OCR block boxes for the overlay (flattened to what the template needs).
const ocrBlocks = computed(() =>
	(props.ocr?.blocks ?? []).map((b, index) => ({ index, box: b.box })),
);

// ── Draw-a-box to add a custom entity ────────────────────────────────────────
// When `canAdd` (detection complete), the reviewer can drag on the image to mark
// a region the detection missed. The drag builds a box in the image's natural
// pixel coordinates; on release a label popover opens, and confirming emits an
// `add-image-entity` the page turns into a redaction edit.

interface DrawBox {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

// The live drag, in natural pixel coordinates (null when not drawing).
const drawing = ref(false);
const drawBox = ref<DrawBox | null>(null);
let drawStart: { x: number; y: number } | null = null;

// The finished box awaiting a label, plus the popover anchor rect + chosen label.
const pendingBox = ref<DrawBox | null>(null);
const pendingRect = ref<DOMRect | null>(null);
const pendingLabel = ref("");

// The anchor rect is a screen rect, so it must follow the box when the image is
// zoomed while the label popover is open — re-derive it from the box's natural
// coordinates after the container has resized (nextTick), so it tracks the box.
watch(zoom, async () => {
	if (!pendingBox.value) return;
	await nextTick();
	pendingRect.value = boxScreenRect(pendingBox.value);
});

// When a reviewer draws a box before detection completes (`canAdd` false), a hint
// anchors here instead of the label popover — telling them to run detection first.
const hintRect = ref<DOMRect | null>(null);

/** Convert a pointer event to natural-pixel coordinates within the image, clamped
 * to its bounds. Returns null if the natural size isn't known yet. */
function toNatural(event: PointerEvent): { x: number; y: number } | null {
	const el = container.value;
	const n = natural.value;
	if (!el || !n) return null;
	const rect = el.getBoundingClientRect();
	const fx = (event.clientX - rect.left) / rect.width;
	const fy = (event.clientY - rect.top) / rect.height;
	return {
		x: Math.min(n.w, Math.max(0, fx * n.w)),
		y: Math.min(n.h, Math.max(0, fy * n.h)),
	};
}

function onPointerDown(event: PointerEvent) {
	// Only the primary button starts a draw, and not while a popover is already
	// open. A click on an existing box (focus) is left alone. The draw gesture is
	// allowed even before detection completes: on release we either open the label
	// popover (`canAdd`) or show the "run detection first" hint.
	if (event.button !== 0 || pendingBox.value) return;
	if ((event.target as HTMLElement).closest(".studio-image-box")) return;
	const p = toNatural(event);
	if (!p) return;
	hintRect.value = null;
	drawStart = p;
	drawing.value = true;
	drawBox.value = { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
	(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	event.preventDefault();
}

function onPointerMove(event: PointerEvent) {
	if (!drawing.value || !drawStart) return;
	const p = toNatural(event);
	if (!p) return;
	drawBox.value = {
		minX: Math.min(drawStart.x, p.x),
		minY: Math.min(drawStart.y, p.y),
		maxX: Math.max(drawStart.x, p.x),
		maxY: Math.max(drawStart.y, p.y),
	};
}

function onPointerUp() {
	if (!drawing.value) return;
	drawing.value = false;
	const box = drawBox.value;
	drawStart = null;
	drawBox.value = null;
	// Ignore a click / negligible drag (needs a real region, ≥ a few px each side).
	if (!box || box.maxX - box.minX < 3 || box.maxY - box.minY < 3) return;
	const rect = boxScreenRect(box);
	if (!props.canAdd) {
		// Adding needs a completed detection — show the hint where they drew rather
		// than the label popover, and don't keep the box.
		hintRect.value = rect;
		return;
	}
	// Freeze the box + its on-screen rect to anchor the label popover.
	pendingBox.value = box;
	pendingRect.value = rect;
	pendingLabel.value = "";
}

/** The current on-screen rect of a natural-pixel box (for anchoring the popover). */
function boxScreenRect(box: DrawBox): DOMRect | null {
	const el = container.value;
	const n = natural.value;
	if (!el || !n) return null;
	const rect = el.getBoundingClientRect();
	const sx = rect.width / n.w;
	const sy = rect.height / n.h;
	return new DOMRect(
		rect.left + box.minX * sx,
		rect.top + box.minY * sy,
		(box.maxX - box.minX) * sx,
		(box.maxY - box.minY) * sy,
	);
}

function confirmAdd() {
	const box = pendingBox.value;
	if (!box || !pendingLabel.value) return;
	emit("add-image-entity", { label: pendingLabel.value, box });
	cancelAdd();
}

function cancelAdd() {
	pendingBox.value = null;
	pendingRect.value = null;
	pendingLabel.value = "";
}
</script>

<template>
  <!-- Positioned viewport: the scroll canvas fills it and the controls float over
       it (bottom-center), so the controls' position never depends on the image
       size / zoom. -->
  <div class="relative h-full">
    <!-- Scroll canvas: fills the available width; zoom sizes the image within it
         (100% = fit width), so higher zoom genuinely widens the image and the
         canvas scrolls. -->
    <!-- `justify-center-safe`: center while it fits, but fall back to start
         alignment once the image overflows, so the left edge stays scrollable at
         high zoom (plain `justify-center` clips the overflow past the start edge). -->
    <div class="flex h-full justify-center-safe overflow-auto p-6">
      <!-- The image + overlays share one positioned, zoom-sized box, so overlay
           coordinates (percent of natural size) line up with the rendered image at
           any zoom. `width` (not a scale transform) drives zoom so the layout
           reflows and the box actually changes width. -->
      <div
        v-if="contentUrl"
        ref="container"
        class="relative h-fit flex-shrink-0 shadow-lg"
        :class="{ 'cursor-crosshair': canAdd, 'select-none': drawing }"
        :style="{ width: `${zoom}%` }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
      >
        <img
          :src="contentUrl"
          :alt="displayName"
          class="block w-full bg-white"
          @load="onImgLoad"
          @error="emit('phase', { status: 'error' })"
        />

        <!-- OCR layout overlay (toggle): faint boxes over every recognized block. -->
        <div
          v-if="showOcr && natural"
          class="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div
            v-for="block in ocrBlocks"
            :key="`ocr-${block.index}`"
            class="absolute border border-dashed border-muted-foreground/50"
            :style="boxStyle(block.box.minX, block.box.minY, block.box.maxX, block.box.maxY)"
          />
        </div>

        <!-- Entity bounding boxes (default on): category-colored outline + a
             label chip; click to focus. Dimmed when suppressed. -->
        <div v-if="natural" class="absolute inset-0">
          <button
            v-for="entity in entities"
            :key="entity.id"
            type="button"
            :data-entity-id="entity.id"
            :data-category="entity.category ?? 'none'"
            class="studio-image-box absolute"
            :class="{
              'studio-image-box--active': entity.id === activeEntityId,
              'studio-image-box--suppressed': entity.suppressed,
            }"
            :style="boxStyle(entity.box.minX, entity.box.minY, entity.box.maxX, entity.box.maxY)"
            @click="emit('focus-entity', entity.id)"
          >
            <span class="studio-image-box__label">{{ entity.label }}</span>
          </button>
        </div>

        <!-- The live drag box while drawing, and the frozen box awaiting a label —
             one clean solid outline for both. -->
        <div
          v-if="drawBox || pendingBox"
          class="pointer-events-none absolute rounded-sm border-2 border-primary bg-primary/10"
          :style="boxStyle(
            (drawBox ?? pendingBox)!.minX,
            (drawBox ?? pendingBox)!.minY,
            (drawBox ?? pendingBox)!.maxX,
            (drawBox ?? pendingBox)!.maxY,
          )"
        />
      </div>
    </div>

    <!-- Label picker for a drawn box, anchored to its on-screen rect. -->
    <AddEntityPopover
      v-model:label="pendingLabel"
      :rect="pendingRect"
      :location="t('studio.preview.imageRegion')"
      @confirm="confirmAdd"
      @cancel="cancelAdd"
    />

    <!-- Hint when a box is drawn before detection completes. -->
    <AddEntityHint
      :rect="hintRect"
      :message="t('studio.preview.addNeedsDetection')"
      @dismiss="hintRect = null"
    />

    <!-- Controls (this view owns its zoom + the OCR toggle). Floated over the
         canvas at bottom-center, so their position is fixed regardless of zoom. -->
    <div
      class="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-md border border-border bg-card px-3 py-1.5 shadow-lg"
    >
      <ZoomIn :size="14" class="text-muted-foreground" />
      <input
        type="range"
        :min="ZOOM_MIN"
        :max="ZOOM_MAX"
        step="5"
        :value="zoom"
        class="h-1 w-32 cursor-pointer accent-primary"
        :aria-label="t('studio.preview.zoom')"
        @input="onZoomInput"
      />
      <span class="min-w-[38px] text-right font-mono text-xs tabular-nums text-muted-foreground">
        {{ zoom }}%
      </span>

      <!-- OCR toggle: always shown, disabled until an OCR layout is available. -->
      <button
        type="button"
        class="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-40"
        :class="showOcr ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'"
        :disabled="!hasOcr"
        :aria-pressed="showOcr"
        @click="showOcr = !showOcr"
      >
        <ScanText :size="13" />
        {{ t("studio.preview.ocr") }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Entity box: a category-colored outline (hue from `--flag`, set by
   `data-category` — see entities.css) with a corner label chip. */
.studio-image-box {
  border: 2px solid var(--flag);
  border-radius: 2px;
  background: color-mix(in oklch, var(--flag) 12%, transparent);
  transition: background 120ms ease;
}
.studio-image-box:hover {
  background: color-mix(in oklch, var(--flag) 22%, transparent);
}
/* Active: intensify the existing border + a soft glow, rather than adding a
   second outline line (which read as a double border). */
.studio-image-box--active {
  box-shadow: 0 0 0 1px var(--flag);
  background: color-mix(in oklch, var(--flag) 24%, transparent);
}
.studio-image-box--suppressed {
  opacity: 0.4;
}
.studio-image-box__label {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  padding: 0 4px;
  font-size: 10px;
  line-height: 1.4;
  white-space: nowrap;
  color: white;
  background: var(--flag);
  border-radius: 2px 2px 0 0;
}
</style>
