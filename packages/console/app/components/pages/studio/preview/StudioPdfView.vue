<script setup lang="ts">
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * Read-only PDF preview with detected-entity highlighting. One of the studio
 * views (see the shared contract in `useStudioView`); it reports its loading
 * phase (`downloading` -> `rendering` -> `ready`) so the host shows one loader.
 *
 * Rendered by SuperDoc's PDF viewer (pdf.js under the hood), keyed to an
 * `application/pdf` file. SuperDoc paginates the PDF to canvas plus a pdf.js
 * text layer (so the reviewer can select and copy the text). The viewer has no
 * decoration/anchor API like the DOCX editor, so we paint our own overlay.
 *
 * Highlighting is BY GEOMETRY: a PDF entity carries page-normalized boxes
 * (`rects`, 0..1 top-left) on a 1-based `page`, computed upstream from the
 * glyph positions of the same PDF pdf.js renders. We overlay each box as a
 * percent-positioned div on its page — no cross-extractor offset mapping, so
 * the box lands exactly on the rendered glyphs at any zoom. The overlay is
 * `pointer-events:none` so it never blocks text selection; click → focus is
 * hit-tested against the boxes.
 *
 * SuperDoc + pdf.js are heavy, so they're dynamically imported when a PDF opens.
 */
// The studio-view contract, declared locally (Vue's defineProps/defineEmits
// macros can't resolve a type imported through the `#console` alias as their
// whole generic, but a local interface works). Mirrors the shared
// `StudioViewProps`/`StudioViewEmits`; the add-entity flow isn't wired here yet
// (no selection→source-byte map for a PDF), so there's no `canAdd`/`add` here.
interface Props {
	/** Blob object URL of the PDF file, or null when nothing is open. */
	contentUrl: string | null;
	/** Detected entities to highlight (by their page + normalized rects). */
	entities?: TextEntityView[];
	/** Currently focused entity id, for the active style + scroll-into-view. */
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
const emit = defineEmits<Emits>();

const { t } = useI18n();

const container = ref<HTMLElement | null>(null);

// The live SuperDoc instance. SuperDoc's public types are broad, so it's narrowly
// typed to the one method we call on teardown.
let superdoc: { destroy?: () => void } | null = null;
// Observes the viewer subtree so highlights repaint when a page (re)mounts —
// pages render lazily and re-render on zoom, replacing their canvas.
let observer: MutationObserver | null = null;
// Coalesce bursts of DOM mutations (a page render emits many) into one repaint.
let repaintHandle: ReturnType<typeof setTimeout> | null = null;

/** The class the shared entity styling targets (see assets/css/entities.css). */
const CHIP_CLASS = "docx-chip";
/** The class on our overlay container, so a repaint can clear the prior pass. */
const LAYER_CLASS = "studio-pdf-highlights";

async function render(url: string, target: HTMLElement) {
	teardown();
	emit("phase", { status: "downloading" });
	try {
		// Dynamic import: SuperDoc + pdf.js are large, so they only load when a PDF
		// opens. SuperDoc's PDF viewer does NOT bundle the pdf.js *library* — it
		// requires the caller to pass it via `modules.pdf.pdfLib` (otherwise its
		// adapter dereferences `undefined.GlobalWorkerOptions` and the viewer's
		// setup throws "Cannot convert undefined or null to object"). So load
		// `pdfjs-dist` here and hand it in, with its worker wired up. `?url` has the
		// bundler emit the worker as an asset on our own origin (not SuperDoc's CDN
		// fallback, which would break offline on desktop and under the CSP).
		const [{ SuperDoc }, pdfLib, { default: workerSrc }] = await Promise.all([
			import("superdoc"),
			import("pdfjs-dist"),
			import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
			import("superdoc/style.css"),
		]);
		if (props.contentUrl !== url || container.value !== target) return;

		pdfLib.GlobalWorkerOptions.workerSrc = workerSrc;

		// Fetch the PDF bytes and wrap them in a real `File` — SuperDoc keys off the
		// name/extension and MIME type to recognize a PDF and route it to the PDF
		// viewer, so a bare Blob from a blob: URL (no name) is not enough.
		const bytes = await (await fetch(url)).arrayBuffer();
		if (props.contentUrl !== url || container.value !== target) return;
		const file = new File([bytes], "document.pdf", { type: "application/pdf" });
		// Bytes in hand; SuperDoc now lays the document out (the slow phase).
		emit("phase", { status: "rendering" });

		target.replaceChildren();
		target.id =
			target.id || `studio-pdf-${Math.random().toString(36).slice(2)}`;
		superdoc = new SuperDoc({
			selector: `#${target.id}`,
			document: file,
			documentMode: "viewing",
			// Read-only preview: links must not navigate.
			hyperlinks: false,
			// Supply the pdf.js library to SuperDoc's PDF viewer (it doesn't bundle
			// the library itself; `setWorker: false` because we set `workerSrc`
			// above). `textLayer: true` renders pdf.js's selectable text spans over
			// each page — highlighting is by geometry (the entities' page-normalized
			// `rects`), but the text layer is what lets the reviewer select and copy
			// the PDF's text.
			modules: { pdf: { pdfLib, setWorker: false, textLayer: true } },
			// Disable SuperDoc's built-in loading overlay — the parent preview shows a
			// single loader and keeps it up until we signal ready.
			ui: { loading: false },
			// A PDF opens the viewer, not an editor, so the editor `onReady` never
			// fires (it waits on editors that a viewer has none of). The PDF viewer
			// signals completion through `pdf:document-ready` instead — that's what
			// drops the host's loader.
			onPdfDocumentReady: () => {
				emit("phase", { status: "ready" });
				scheduleRepaint();
			},
			// Surface a load/parse failure so the loader doesn't hang forever.
			onException: (error: unknown) => {
				if (props.contentUrl !== url) return;
				emit("phase", {
					status: "error",
					message: getErrorMessage(error, t("studio.preview.pdfFailed")),
				});
			},
		}) as { destroy?: () => void };

		// Pages render lazily and re-render on zoom; watch the viewer subtree and
		// repaint highlights whenever a page's content changes.
		// Ignore mutations that only touch our own overlay — otherwise painting it
		// re-triggers the observer, a feedback loop that churns the boxes (flicker,
		// and a click that lands between a box's removal and its recreation).
		observer = new MutationObserver((mutations) => {
			const external = mutations.some((m) => {
				if ((m.target as HTMLElement).closest?.(`.${LAYER_CLASS}`))
					return false;
				const touched = [...m.addedNodes, ...m.removedNodes];
				return touched.some(
					(n) =>
						!(n instanceof HTMLElement) || !n.classList.contains(LAYER_CLASS),
				);
			});
			if (external) scheduleRepaint();
		});
		observer.observe(target, { childList: true, subtree: true });
	} catch (error) {
		if (props.contentUrl === url) {
			teardown();
			// Release the host's loader even on failure, so it doesn't hang.
			emit("phase", {
				status: "error",
				message: getErrorMessage(error, t("studio.preview.pdfFailed")),
			});
		}
		console.error("[studio-pdf] SuperDoc render failed", error);
	}
}

/** Repaint on the next tick, collapsing a burst of mutations into one pass. */
function scheduleRepaint() {
	if (repaintHandle) clearTimeout(repaintHandle);
	repaintHandle = setTimeout(paintHighlights, 60);
}

/**
 * Paint the entity highlights over every rendered page. For each page it rebuilds
 * one overlay of percent-positioned boxes straight from the entities' rendered
 * geometry: an entity on this page contributes one box per `rect` (page-normalized
 * 0..1, top-left), so a span wrapping several lines yields several boxes. Percent
 * positioning tracks the page as zoom resizes it; placed by geometry, not by
 * mapping offsets into the text layer.
 */
function paintHighlights() {
	const target = container.value;
	if (!target) return;
	// Pause the observer around our own DOM writes, so appending/removing the
	// overlay can't re-trigger a repaint (the filter already drops overlay-only
	// mutations; this also keeps the whole paint out of the observer's queue).
	observer?.disconnect();
	for (const page of target.querySelectorAll<HTMLElement>(
		".sd-pdf-viewer-page",
	)) {
		// Rebuild this page's overlay from scratch (cheap; entity sets are small).
		for (const node of page.querySelectorAll(`.${LAYER_CLASS}`)) {
			node.remove();
		}
		const pageNumber = Number(page.getAttribute("data-page-number"));
		const overlay = document.createElement("div");
		overlay.className = LAYER_CLASS;

		for (const entity of props.entities) {
			// Only rendered, page-scoped entities paint here; a source-only or
			// metadata entity carries no page geometry.
			if (entity.page !== pageNumber || !entity.rects?.length) continue;
			for (const rect of entity.rects) {
				overlay.appendChild(
					highlightBox(entity, {
						left: rect.x,
						top: rect.y,
						width: rect.width,
						height: rect.height,
					}),
				);
			}
		}
		// The page is `position:relative`, so an `inset:0` overlay sits exactly over
		// it and the boxes' percentages are of the page box the glyphs render in.
		if (overlay.childElementCount > 0) page.appendChild(overlay);
	}
	// Resume watching for real page changes.
	observer?.observe(target, { childList: true, subtree: true });
}

/** One highlight box for an entity match, styled + class-tagged like a chip. */
function highlightBox(
	entity: TextEntityView,
	rect: { left: number; top: number; width: number; height: number },
): HTMLElement {
	const box = document.createElement("div");
	// Style via classes (the category class carries the hue, see entities.css).
	box.className = [
		CHIP_CLASS,
		`docx-cat-${entity.category ?? "none"}`,
		entity.id === props.activeEntityId ? `${CHIP_CLASS}--active` : "",
		entity.suppressed ? `${CHIP_CLASS}--suppressed` : "",
	]
		.filter(Boolean)
		.join(" ");
	// `data-entity` is the shared anchor the other text previews (code/CSV) use:
	// it's what the host's detail popover queries to position itself against the
	// focused entity's chip, and what click → focus hit-tests for.
	box.dataset.entity = entity.id;
	// `pointer-events:none`: the box must NOT capture the pointer, or it would
	// block the pdf.js text layer beneath it from being selected (you could select
	// everywhere except over a detected entity). Click → focus is handled by
	// geometrically hit-testing the click point against the box rects (see
	// `onPointerUp`) — not via the event target, which is the text layer.
	box.style.cssText = `position:absolute; pointer-events:none; left:${
		rect.left * 100
	}%; top:${rect.top * 100}%; width:${rect.width * 100}%; height:${
		rect.height * 100
	}%;`;
	return box;
}

function teardown() {
	if (repaintHandle) {
		clearTimeout(repaintHandle);
		repaintHandle = null;
	}
	observer?.disconnect();
	observer = null;
	try {
		superdoc?.destroy?.();
	} catch {
		// best-effort
	}
	superdoc = null;
}

// A full repaint when the entity SET changes (detection results load async after
// mount). A focus change must NOT repaint — rebuilding the boxes would destroy the
// one the host's popover just anchored to (snapping it to the corner) and drop the
// box mid-click; instead just move the `--active` class on the existing boxes.
watch(() => props.entities, scheduleRepaint, { deep: true });
watch(() => props.activeEntityId, applyActive);

// Move the `--active` class to the focused entity's boxes, without rebuilding.
// Scrolling the focused chip into view is the dispatcher's job (it owns the
// popover anchor too), so this only toggles the highlight ring.
function applyActive() {
	const active = `${CHIP_CLASS}--active`;
	for (const box of container.value?.querySelectorAll<HTMLElement>(
		`.${LAYER_CLASS} .${CHIP_CLASS}`,
	) ?? []) {
		box.classList.toggle(active, box.dataset.entity === props.activeEntityId);
	}
}

// Render whenever the file (or the container, after mount) changes.
watch(
	[() => props.contentUrl, container],
	([url, target]) => {
		if (!target) return;
		if (!url) {
			teardown();
			emit("phase", { status: "idle" });
			return;
		}
		render(url, target);
	},
	{ immediate: true },
);

// Click → focus, without stealing text selection. The highlight boxes are
// `pointer-events:none` so a drag selects the text layer beneath them — which
// also means the click can't be read off the event target, AND `elementsFromPoint`
// won't return the boxes (it skips `pointer-events:none` elements). So: remember
// where the pointer went down, and on pointer-up, if it barely moved (a drag is a
// text selection, left alone), hit-test the point GEOMETRICALLY against each box's
// rect and focus that entity. A later box wins a tie (painted on top).
let downX = 0;
let downY = 0;
/** Max pointer travel (px) still counted as a click rather than a drag-select. */
const CLICK_SLOP = 4;

function onPointerDown(event: PointerEvent) {
	downX = event.clientX;
	downY = event.clientY;
}

function onPointerUp(event: PointerEvent) {
	if (
		Math.abs(event.clientX - downX) > CLICK_SLOP ||
		Math.abs(event.clientY - downY) > CLICK_SLOP
	)
		return; // a drag (text selection), not a click
	const x = event.clientX;
	const y = event.clientY;
	let hit: string | undefined;
	for (const box of container.value?.querySelectorAll<HTMLElement>(
		`.${LAYER_CLASS} [data-entity]`,
	) ?? []) {
		const r = box.getBoundingClientRect();
		if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
			hit = box.dataset.entity; // last match wins (topmost paint)
	}
	if (hit) emit("focus-entity", hit);
}

onBeforeUnmount(teardown);
</script>

<template>
  <div class="studio-pdf-canvas relative h-full overflow-auto">
    <!-- The SuperDoc mount target is ALWAYS present (never behind v-if), so the
         instance mounts into a live element. SuperDoc sizes its own paginated
         surface, so the target grows to content (the canvas above scrolls); a
         min-height keeps it measurable at mount. Loading and error UI are owned
         by the host, driven by the `phase` events this view emits. -->
    <div
      ref="container"
      class="studio-pdf min-h-full w-full"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
    />
  </div>
</template>

<style scoped>
/* Tint the backdrop the PDF pages sit on to the app's content surface, so the
   canvas matches the rest of the studio. (The page frame and the page spacing are
   shared across the paged previews — see assets/css/preview.css.) */
.studio-pdf-canvas {
  background: var(--background);
}

/* Center the pages horizontally (SuperDoc's root is a flex row that left-aligns a
   page-width column when the container is wider). */
.studio-pdf :deep(.superdoc) {
  justify-content: center;
}

/* The highlight overlay fills the page; its boxes are percent-positioned within
   it, so they track the page as zoom resizes it. `pointer-events:none` (on the
   layer and every box) so the pdf.js text layer beneath stays selectable — click
   → focus is hit-tested in JS, not captured here. */
.studio-pdf :deep(.studio-pdf-highlights) {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Neutralize SuperDoc's own PDF selection layer. It sits above the text layer
   (z-index 10) and flips to `pointer-events:auto` on mousedown to run SuperDoc's
   selection handling — but in this read-only viewer that handling just swallows
   the pointer, blocking both native text selection on the pdf.js text layer and
   our own click → focus (the pointerup never reaches the container). Forcing it
   off hands pointer events back to the text layer and the highlight hit-test.
   `!important` because SuperDoc sets `pointer-events` inline on this element. */
.studio-pdf :deep(.superdoc__selection-layer) {
  pointer-events: none !important;
}

/* In dark mode the default light scrollbar glares against the dark backdrop. */
:global(.dark) .studio-pdf-canvas {
  scrollbar-color: var(--border) transparent;
}
</style>
