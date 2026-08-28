<script setup lang="ts">
import { renderAsync } from "docx-preview";
import JSZip from "jszip";
import { useEventListener } from "@vueuse/core";
import { Loader2, TriangleAlert } from "@lucide/vue";
import AddEntityPopover from "./AddEntityPopover.vue";
import type { TextEntityView } from "#console/composables/useTextEntities";
import type {
	AddEntityInput,
	PendingAdd,
} from "#console/composables/useStudioAudit";
import {
	type DocxPartCategory,
	type DocxRun,
	docxPartCategory,
	isRenderedDocxPart,
	parseDocxParts,
	resolveDocxSelection,
	resolveDocxSpan,
} from "#console/utils/preview";

/**
 * Read-only Word (.docx) preview with detected-entity highlighting.
 *
 * The download is the original OOXML zip, rendered client-side by docx-preview.
 * Highlighting maps each entity's raw-source byte span (a `SourceRef` into
 * `word/document.xml`) onto the rendered run it belongs to: we parse the same
 * `document.xml` into ordered `<w:t>` runs (with byte spans), align those runs
 * to the rendered text nodes in document order, then wrap the matched char
 * range in a chip. Keying on the run sidesteps the synthetic text (tabs,
 * symbols, footnotes) docx-preview injects, which would desync a char walk.
 */
const props = withDefaults(
	defineProps<{
		/** Blob object URL of the .docx file, or null when nothing is open. */
		contentUrl: string | null;
		/** Detected entities to highlight (their `sourceRefs` address the docx). */
		entities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
		/** Whether the reviewer may add entities by selecting text (detection complete). */
		canAdd?: boolean;
		/** Zoom percentage (100 = actual size) applied to the rendered pages. */
		zoomLevel?: number;
	}>(),
	{ entities: () => [], activeEntityId: null, canAdd: false, zoomLevel: 100 },
);

// Scale the rendered pages to the zoom level. `zoom` (not `transform: scale`)
// reflows the layout box, so the scroll area and the grey canvas track the
// scaled size — a transform would leave the container at its unscaled height,
// letting you scroll past the shrunk document into empty space.
const zoomStyle = computed(() => ({ zoom: props.zoomLevel / 100 }));

const emit = defineEmits<{
	"focus-entity": [id: string];
	/** Mark a selected span as a new entity to redact (raw part byte span + label). */
	"add-entity": [payload: AddEntityInput];
}>();

const { t } = useI18n();
const { resolveLabel } = useLabels();

// The catalog's generic "unresolved entity" label — the default for a
// reviewer-added span, matching the text view. Only used when the catalog has it.
const DEFAULT_ADD_LABEL = "unresolved";

const container = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const hasError = ref(false);

// The pending add: the reviewer's selection frozen when the popover opened — its
// raw part byte span (for the redaction edit + the document highlight), its text
// and rect (for the popover). Frozen so the popover survives the browser
// selection collapsing when the reviewer clicks the label picker.
const pending = ref<PendingAdd | null>(null);
const pendingLabel = ref("");

// The pending span as a synthetic highlight entity, resolved through the same run
// mapping as detected ones (via its raw part `sourceRefs`), tagged `pending` for
// the selection-style chip. Null when nothing is pending.
const pendingEntity = computed<TextEntityView | null>(() => {
	const p = pending.value;
	if (!p?.source) return null;
	return {
		id: "__pending__",
		modality: "text",
		label: "",
		category: "pending",
		start: 0,
		end: 0,
		confidence: 1,
		sourceRefs: [
			{ part: p.source.part, start: p.source.start, end: p.source.end },
		],
	};
});

// The parsed <w:t> runs of the rendered doc, each paired with the DOM element
// that holds its text (filled after a successful render + alignment). We store
// the parent element (stable) rather than the text node, so chip wrapping —
// which replaces the text node — never invalidates the reference; each pass
// normalizes the parent and re-locates the run's text.
let runNodes: { run: DocxRun; parent: HTMLElement }[] = [];

// How many runs ahead to look within a part when the current node doesn't match
// its next run, so a single run the renderer transformed (whitespace collapsing,
// xml:space, a split run) can't stall alignment for the rest of that part.
const ALIGN_LOOKAHEAD = 8;

/**
 * The rendered region a DOM text node sits in, from its nearest structural
 * ancestor: docx-preview renders headers into `<header>`, footers into
 * `<footer>`, and foot/endnotes into `<li>`; everything else is body content.
 * A text node is only aligned to runs whose part is the same category, so
 * identical text in (say) a header and the body can't cross-map.
 */
function nodeCategory(node: Text): DocxPartCategory {
	for (
		let el = node.parentElement;
		el && el !== container.value;
		el = el.parentElement
	) {
		const tag = el.tagName;
		if (tag === "HEADER") return "header";
		if (tag === "FOOTER") return "footer";
		if (tag === "LI") return "note";
	}
	return "body";
}

/**
 * Walk the rendered DOM's text nodes in order and align each to a parsed run.
 * The parts render in the DOM in an order we don't control (docx-preview emits
 * header -> body -> footer per page, not part-name order), so we track a cursor
 * per part rather than one global one: each text node is matched against the
 * next unconsumed run of a part in the *same rendered region* (body / header /
 * footer / note), with a bounded lookahead for renderer-transformed runs.
 * Restricting to the node's region keeps identical text across parts from
 * cross-mapping. Synthetic nodes (tabs, symbols) match nothing and are skipped.
 */
function alignRuns(root: HTMLElement, runs: DocxRun[]) {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	const pairs: { run: DocxRun; parent: HTMLElement }[] = [];
	// Group each part's runs (in order) with its own consume cursor, and index
	// those groups by rendered region so a text node only considers its own.
	const byPart = new Map<string, { runs: DocxRun[]; cursor: number }>();
	const byCategory = new Map<
		DocxPartCategory,
		{ runs: DocxRun[]; cursor: number }[]
	>();
	for (const run of runs) {
		let g = byPart.get(run.part);
		if (!g) {
			g = { runs: [], cursor: 0 };
			byPart.set(run.part, g);
			const cat = docxPartCategory(run.part);
			const list = byCategory.get(cat) ?? [];
			list.push(g);
			byCategory.set(cat, list);
		}
		g.runs.push(run);
	}
	let node = walker.nextNode() as Text | null;
	while (node) {
		const value = node.nodeValue;
		const parent = node.parentElement;
		if (value && parent) {
			// Only parts from this node's rendered region are candidates; take the
			// first next-unconsumed run (with lookahead) that matches and advance it.
			for (const g of byCategory.get(nodeCategory(node)) ?? []) {
				const limit = Math.min(g.cursor + ALIGN_LOOKAHEAD, g.runs.length);
				let matched = false;
				for (let j = g.cursor; j < limit; j++) {
					const run = g.runs[j]!;
					if (run.text.length > 0 && run.text === value) {
						pairs.push({ run, parent });
						g.cursor = j + 1;
						matched = true;
						break;
					}
				}
				if (matched) break;
			}
		}
		node = walker.nextNode() as Text | null;
	}
	return pairs;
}

async function render(url: string, target: HTMLElement) {
	isLoading.value = true;
	hasError.value = false;
	target.replaceChildren();
	runNodes = [];
	try {
		const buffer = await (await fetch(url)).arrayBuffer();
		// The file may have changed while the fetch was in flight.
		if (props.contentUrl !== url || container.value !== target) return;
		await renderAsync(buffer, target, undefined, {
			className: "docx",
			inWrapper: true,
			ignoreWidth: false,
			breakPages: true,
		});
		if (props.contentUrl !== url || container.value !== target) return;
		// This preview is read-only: neutralize hyperlinks so they don't navigate
		// (and lose the link cursor / keyboard activation), keeping their text.
		for (const a of target.querySelectorAll("a[href]")) {
			a.removeAttribute("href");
			a.removeAttribute("target");
		}
		// Parse every rendered part (document body + headers/footers/notes) for
		// run byte-spans, then align them to the DOM. docx-preview renders those
		// parts into the same tree, so a single ordered text-node walk aligns all.
		const zip = await JSZip.loadAsync(buffer);
		const parts = new Map<string, string>();
		await Promise.all(
			Object.values(zip.files)
				.filter((f) => !f.dir && isRenderedDocxPart(f.name))
				.map(async (f) => parts.set(f.name, await f.async("string"))),
		);
		if (props.contentUrl !== url || container.value !== target) return;
		runNodes = alignRuns(target, parseDocxParts(parts));
		applyHighlights();
	} catch {
		if (props.contentUrl === url) {
			hasError.value = true;
			target.replaceChildren();
		}
	} finally {
		if (props.contentUrl === url) isLoading.value = false;
	}
}

/**
 * Overlay entity chips onto the aligned runs. Each render pass rebuilds the
 * chips from scratch (cheap; runs are already located), so focus changes and
 * entity-set changes both flow through here.
 */
function applyHighlights() {
	if (!runNodes.length) return;
	// Clear previous chips: unwrap any highlight spans back to plain text so the
	// run text nodes are whole again before re-wrapping.
	clearHighlights();

	// Group the resolved char ranges per run so a run with several entities is
	// split once, left-to-right.
	const perRun = new Map<
		number,
		{ start: number; end: number; entity: TextEntityView }[]
	>();
	const runs = runNodes.map((p) => p.run);
	// Detected + added entities, plus the pending add (while its popover is open)
	// so the reviewer keeps seeing the span they're about to add after the native
	// selection clears — the same `pending` chip treatment as the text view.
	const highlighted = pendingEntity.value
		? [...props.entities, pendingEntity.value]
		: props.entities;
	for (const entity of highlighted) {
		for (const ref of entity.sourceRefs ?? []) {
			// Resolve within the ref's own part (document body, header, footer, …);
			// spans in non-rendered parts (e.g. a .rels hyperlink target) match no
			// run and are skipped.
			for (const span of resolveDocxSpan(runs, ref.part, ref.start, ref.end)) {
				const list = perRun.get(span.runIndex) ?? [];
				list.push({ start: span.charStart, end: span.charEnd, entity });
				perRun.set(span.runIndex, list);
			}
		}
	}

	for (const { run, parent } of runNodes) {
		const spans = perRun.get(run.index);
		if (spans?.length) wrapRun(parent, run, spans);
	}
	// Chips were recreated without the active ring; reapply it (no scroll — the
	// focus itself didn't change) so a rebuild mid-focus keeps the highlight.
	syncActiveChip(false);
}

/**
 * Reflect the active entity on the chips: ring the focused one and, when
 * `scroll` is set, bring it into view. Called both when the focus changes and
 * after chips are rebuilt (so the ring survives a re-highlight).
 */
function syncActiveChip(scroll: boolean) {
	if (!container.value) return;
	const id = props.activeEntityId;
	let active: HTMLElement | null = null;
	for (const el of container.value.querySelectorAll<HTMLElement>(
		".docx-chip",
	)) {
		const isActive = el.dataset.entity === id;
		el.classList.toggle("docx-chip--active", isActive);
		// Capture the match here rather than re-querying with the id interpolated
		// into a selector (which would throw on `"`, `]`, `\`, etc. in an id).
		if (isActive) active = el;
	}
	if (scroll) active?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/**
 * Wrap each entity char range in the run's text with a chip `<span>`, preserving
 * the plain text between/around them. The run's `<span>` holds a single text
 * node after normalization; we locate the one matching the run text (a run span
 * may hold nested markup, so match on content) and replace it with the split.
 * Ranges are sorted and clamped; overlaps keep the first.
 */
function wrapRun(
	parent: HTMLElement,
	run: DocxRun,
	spans: { start: number; end: number; entity: TextEntityView }[],
) {
	parent.normalize();
	const node = [...parent.childNodes].find(
		(n): n is Text => n.nodeType === Node.TEXT_NODE && n.nodeValue === run.text,
	);
	if (!node) return;
	const text = node.nodeValue ?? "";
	const sorted = [...spans].sort((a, b) => a.start - b.start);
	const frag = document.createDocumentFragment();
	let cursor = 0;
	for (const s of sorted) {
		const start = Math.max(s.start, cursor);
		const end = Math.min(s.end, text.length);
		if (end <= start) continue;
		if (start > cursor) frag.append(text.slice(cursor, start));
		const chip = document.createElement("span");
		chip.className = "docx-chip";
		chip.dataset.entity = s.entity.id;
		if (s.entity.category) chip.dataset.category = s.entity.category;
		// Kept (suppressed) entities dim to muted gray — they won't be redacted.
		if (s.entity.suppressed) chip.dataset.suppressed = "";
		chip.title = s.entity.label;
		chip.textContent = text.slice(start, end);
		frag.append(chip);
		cursor = end;
	}
	if (cursor < text.length) frag.append(text.slice(cursor));
	node.parentNode?.replaceChild(frag, node);
}

/** Unwrap all highlight chips, restoring the original run text nodes. */
function clearHighlights() {
	if (!container.value) return;
	for (const chip of container.value.querySelectorAll<HTMLElement>(
		".docx-chip",
	)) {
		chip.replaceWith(document.createTextNode(chip.textContent ?? ""));
	}
	// Merge each run span's split text nodes back into one so the next pass sees
	// whole run text again.
	for (const { parent } of runNodes) parent.normalize();
}

// Re-apply highlights when the entity set changes (a new run finished) or the
// pending add appears/clears. A full re-render isn't needed — runs are located.
watch([() => props.entities, pending], () => applyHighlights(), { deep: true });

// Reflect the active entity when the focus changes: ring the chip and scroll it
// into view.
watch(
	() => props.activeEntityId,
	() => syncActiveChip(true),
);

// Chip clicks bubble as focus events (delegated, since chips are created
// imperatively outside Vue's template).
function onClick(e: MouseEvent) {
	const chip = (e.target as HTMLElement).closest<HTMLElement>(".docx-chip");
	if (chip?.dataset.entity) emit("focus-entity", chip.dataset.entity);
}

// Whether the reviewer may add entities: detection complete, and the runs are
// aligned so a selection can resolve to source bytes.
const addEnabled = computed(() => props.canAdd && runNodes.length > 0);

/**
 * Locate a DOM selection boundary — a node + offset within it — against the
 * aligned runs: the run whose element contains the node, and the char offset of
 * the boundary within that run's text. Walks the run element's text (chips split
 * it into several text nodes) to accumulate the offset up to the boundary node.
 * Returns null when the boundary isn't inside an aligned run.
 */
function locateBoundary(
	node: Node,
	offsetInNode: number,
): { run: DocxRun; char: number } | null {
	const el =
		node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
	for (const { run, parent } of runNodes) {
		if (!parent.contains(node)) continue;
		// Accumulate text length across the run element's descendant text nodes up to
		// the boundary node, so a chip-split run still yields the right char offset.
		let char = 0;
		const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT);
		for (
			let text = walker.nextNode() as Text | null;
			text;
			text = walker.nextNode() as Text | null
		) {
			if (text === node) return { run, char: char + offsetInNode };
			char += text.nodeValue?.length ?? 0;
		}
		// The boundary landed on the element (not a text node) — clamp to its start
		// or end depending on whether it precedes the element's content.
		if (el === parent) return { run, char: offsetInNode > 0 ? char : 0 };
	}
	return null;
}

// Publish a settled selection as a pending add: resolve both boundaries to runs,
// map to a raw part byte span, freeze it, then clear the native selection so our
// own `pending` chip marks the span. Only on mouseup/keyup (settled), so a
// mid-drag change never interrupts the drag — matching the text view.
function onSelectionSettle() {
	if (!addEnabled.value || pending.value) return;
	const root = container.value;
	const sel = window.getSelection();
	if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return;
	const range = sel.getRangeAt(0);
	if (
		!root.contains(range.startContainer) ||
		!root.contains(range.endContainer)
	) {
		return;
	}
	const a = locateBoundary(range.startContainer, range.startOffset);
	const b = locateBoundary(range.endContainer, range.endOffset);
	if (!a || !b) return;
	// Order the endpoints by run then char, so a right-to-left drag resolves the
	// same span (the run ordinal is document order).
	const [from, to] =
		a.run.index < b.run.index ||
		(a.run.index === b.run.index && a.char <= b.char)
			? [a, b]
			: [b, a];
	const span = resolveDocxSelection(from.run, from.char, to.run, to.char);
	if (!span) return;
	pending.value = {
		byteStart: span.start,
		byteEnd: span.end,
		text: sel.toString(),
		rect: range.getBoundingClientRect(),
		source: span,
	};
	pendingLabel.value = resolveLabel(DEFAULT_ADD_LABEL) ? DEFAULT_ADD_LABEL : "";
	window.getSelection()?.removeAllRanges();
}
useEventListener(document, "mouseup", onSelectionSettle);
useEventListener(document, "keyup", onSelectionSettle);

function cancelAdd() {
	pending.value = null;
	pendingLabel.value = "";
	window.getSelection()?.removeAllRanges();
}

function confirmAdd() {
	const p = pending.value;
	if (!p?.source || !pendingLabel.value) return;
	emit("add-entity", {
		byteStart: p.byteStart,
		byteEnd: p.byteEnd,
		label: pendingLabel.value,
		text: p.text,
		source: p.source,
	});
	cancelAdd();
}

// Render whenever the file (or the container, after mount) changes.
watch(
	[() => props.contentUrl, container],
	([url, target]) => {
		if (!target) return;
		if (!url) {
			target.replaceChildren();
			runNodes = [];
			hasError.value = false;
			isLoading.value = false;
			return;
		}
		render(url, target);
	},
	{ immediate: true },
);
</script>

<template>
  <div class="studio-docx-canvas relative h-full overflow-auto">
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <Loader2 :size="24" class="animate-spin text-muted-foreground" />
    </div>
    <div
      v-else-if="hasError"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <TriangleAlert :size="24" class="text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ t("studio.preview.docxFailed") }}
      </p>
    </div>
    <!-- docx-preview renders the document (its own centered, paginated wrapper
         with a grey backdrop and white pages) into this element. -->
    <div
      ref="container"
      class="studio-docx"
      :style="zoomStyle"
      @click="onClick"
    />

    <!-- Add a missed entity: a detail-style card below the text selection. -->
    <AddEntityPopover
      v-model:label="pendingLabel"
      :pending="pending"
      @confirm="confirmAdd"
      @cancel="cancelAdd"
    />
  </div>
</template>

<style scoped>
/* docx-preview ships its own layout (grey backdrop, centered white pages).
   Only re-tint the backdrop to the app's muted surface so it fits the theme;
   the page sizing, margins and shadow are left to the library. */
.studio-docx :deep(.docx-wrapper) {
	background: var(--muted);
	min-height: 100%;
}

/* In dark mode the default light scrollbar glares against the dark backdrop;
   tint it to the theme via the standard scrollbar-color (no pseudo-elements,
   which interfered with docx-preview's rendered canvas). */
:global(.dark) .studio-docx-canvas {
	scrollbar-color: var(--border) transparent;
}

/* Hyperlinks: this preview is read-only (we strip href on render), so drop
   Word's live-link chrome — the blue color and underline. The color/underline
   isn't on the <a> itself but on the run <span> inside it, which docx-preview
   styles via an injected class for Word's "Hyperlink" character style; so target
   the link *and its descendants*, and use !important to beat that injected rule
   (its class selector + source order would otherwise win). Otherwise a link's
   underline stays link-blue and ignores our chip color, so a suppressed (kept)
   entity inside a link would dim its text to gray but keep a stray blue
   underline. Neutralized here, our own chip underline is the only marker. */
.studio-docx :deep(a),
.studio-docx :deep(a *:not(.docx-chip)) {
	color: inherit !important;
	text-decoration: none !important;
}

/* Entity-chip styling (the `.docx-chip` marker underline) is shared and lives
   in assets/css/entities.css so every preview stays consistent. */
</style>
