<script setup lang="ts">
import type { TextEntityView } from "#console/composables/useTextEntities";
import type { StudioViewPhase } from "#console/composables/useStudioView";
import { byteOffsetToChar } from "#console/utils/preview";

/**
 * Read-only PDF preview with detected-entity highlighting. One of the studio
 * views (see the shared contract in `useStudioView`); it reports its loading
 * phase (`downloading` -> `rendering` -> `ready`) so the host shows one loader.
 *
 * Rendered by SuperDoc's PDF viewer (pdf.js under the hood), keyed to an
 * `application/pdf` file. SuperDoc paginates the PDF to canvas plus a pdf.js
 * TEXT LAYER (positioned text spans) — enabled via `modules.pdf.textLayer`. The
 * viewer has no decoration/anchor API like the DOCX editor, so we paint our own
 * overlay.
 *
 * Highlighting is BY OFFSET, not by matching the entity's value: a PDF entity
 * carries a `[start, end)` byte range into its page's decoded text plus the
 * `page` number (the value itself never rides in the audit). elide's per-page
 * decoded text and pdf.js's text layer share the page's reading order, so the
 * same offsets address the same characters in the rendered text layer. We convert
 * the byte offsets to char indices within that page's text (`byteOffsetToChar`,
 * for non-ASCII pages), build a DOM Range over exactly those characters, and lay
 * a percent-positioned highlight box over each client rect.
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
	/** Detected entities to highlight (by their page + byte-offset span). */
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
// Observes the viewer subtree so highlights repaint when the text layer (re)mounts
// — pages render lazily and re-render on zoom, each replacing its text layer.
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
			// above). `textLayer: true` renders pdf.js's text layer over each page —
			// the positioned spans the entity highlighter matches against.
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

		// Pages (and their text layers) render lazily and re-render on zoom; watch
		// the viewer subtree and repaint highlights whenever a text layer changes.
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
 * Paint the entity highlights over every rendered page's text layer. For each
 * page it rebuilds one overlay of absolutely-positioned boxes: the entities on
 * that page are placed by their byte-offset span (converted to a char index into
 * the page's text), located with a DOM Range so a box covers exactly those
 * characters.
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
		const textLayer = page.querySelector<HTMLElement>(
			".sd-pdf-viewer-page__text-layer",
		);
		if (!textLayer) continue;

		// Rebuild this page's overlay from scratch (cheap; entity sets are small).
		for (const node of page.querySelectorAll(`.${LAYER_CLASS}`)) {
			node.remove();
		}
		const pageRect = page.getBoundingClientRect();
		const layerRect = textLayer.getBoundingClientRect();
		if (layerRect.width === 0 || layerRect.height === 0) continue;

		const pageNumber = Number(page.getAttribute("data-page-number"));
		const index = textIndex(textLayer);
		const overlay = document.createElement("div");
		overlay.className = LAYER_CLASS;

		for (const entity of props.entities) {
			// Only decoded, page-scoped entities are locatable on the rendered page;
			// a source-only or metadata entity has no page position.
			if (!entity.decoded || entity.page !== pageNumber) continue;
			// Offsets are UTF-8 byte offsets into the page's text; convert to char
			// indices for the DOM Range (a no-op on an ASCII page).
			const from = byteOffsetToChar(index.text, entity.start);
			const to = byteOffsetToChar(index.text, entity.end);
			for (const rect of rangeRects(index, from, to, pageRect)) {
				overlay.appendChild(highlightBox(entity, rect));
			}
		}
		// Append to the PAGE, not the text layer: pdf.js transforms every direct
		// child of the text layer (`text-layer > :not(.markedContent)` applies a
		// per-glyph scale), which would skew the overlay and break its hit-testing.
		// The page is `position:relative` and the text layer is `inset:0` within it,
		// so an `inset:0` overlay on the page sits exactly over the text.
		if (overlay.childElementCount > 0) page.appendChild(overlay);
	}
	// Resume watching for real page/text-layer changes.
	observer?.observe(target, { childList: true, subtree: true });
}

/**
 * The text layer's characters as one flat string plus a map from a char index to
 * its `(text node, offset within the node)`, so a document-page char range can be
 * turned into a DOM Range. The text layer's spans are in reading order, matching
 * elide's decoded page text.
 */
function textIndex(textLayer: HTMLElement): {
	text: string;
	nodes: { node: Text; start: number }[];
} {
	let text = "";
	const nodes: { node: Text; start: number }[] = [];
	for (const span of textLayer.querySelectorAll<HTMLElement>("span")) {
		const node = span.firstChild;
		if (!node || node.nodeType !== Node.TEXT_NODE) continue;
		nodes.push({ node: node as Text, start: text.length });
		text += node.textContent ?? "";
	}
	return { text, nodes };
}

/** The text node + in-node offset a flat char index falls in, or null. */
function locate(
	index: { nodes: { node: Text; start: number }[] },
	charIndex: number,
): { node: Text; offset: number } | null {
	for (let i = index.nodes.length - 1; i >= 0; i--) {
		const { node, start } = index.nodes[i]!;
		if (charIndex >= start) {
			return { node, offset: Math.min(charIndex - start, node.length) };
		}
	}
	return null;
}

/**
 * The client rects of the `[from, to)` char range across the text layer, as
 * fractions (0..1) of the layer — positioning the overlay in percentages makes it
 * track the page as zoom resizes the layer. A range that spans several lines
 * yields a rect per line.
 */
function rangeRects(
	index: { text: string; nodes: { node: Text; start: number }[] },
	from: number,
	to: number,
	pageRect: DOMRect,
): { left: number; top: number; width: number; height: number }[] {
	const start = locate(index, from);
	const end = locate(index, to);
	if (!start || !end) return [];
	const range = document.createRange();
	range.setStart(start.node, start.offset);
	range.setEnd(end.node, end.offset);
	const out = [...range.getClientRects()].map((r) => ({
		left: (r.left - pageRect.left) / pageRect.width,
		top: (r.top - pageRect.top) / pageRect.height,
		width: r.width / pageRect.width,
		height: r.height / pageRect.height,
	}));
	range.detach?.();
	return out;
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
	// it's what click → focus reads back, and what the host's detail popover
	// queries to position itself against the focused entity's chip.
	box.dataset.entity = entity.id;
	// `pointer-events:auto` inline (not via scoped CSS): the box is created
	// imperatively and lives inside SuperDoc's text layer, so a scoped `:deep`
	// rule is fragile here — set it on the element so the click always lands.
	box.style.cssText = `position:absolute; pointer-events:auto; left:${
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

// Focus a highlight on POINTERDOWN, not click: SuperDoc's PDF viewer inserts a
// selection layer over the page on mousedown, so the following mouseup (and thus
// the `click`) lands on that layer instead of our box. pointerdown still targets
// our box; `preventDefault` stops SuperDoc from starting a text selection from it.
// (Overlay boxes are painted outside Vue's template, so we delegate on the root;
// the entity id is read from the box's `data-entity` attribute — the shared
// anchor the other previews use.)
function onPointerDown(event: PointerEvent) {
	const id = (event.target as HTMLElement).closest<HTMLElement>("[data-entity]")
		?.dataset.entity;
	if (!id) return;
	event.preventDefault();
	emit("focus-entity", id);
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

/* The highlight overlay fills the text layer; its boxes are percent-positioned
   within it, so they track the page as zoom resizes the layer. (The boxes set
   their own `pointer-events:auto` inline, for click → focus.) `user-select:none`
   so clicking a box focuses the entity instead of starting a text selection on
   the pdf.js text layer underneath (which would otherwise stick). */
.studio-pdf :deep(.studio-pdf-highlights) {
  position: absolute;
  inset: 0;
  pointer-events: none;
  user-select: none;
}

/* In dark mode the default light scrollbar glares against the dark backdrop. */
:global(.dark) .studio-pdf-canvas {
  scrollbar-color: var(--border) transparent;
}
</style>
