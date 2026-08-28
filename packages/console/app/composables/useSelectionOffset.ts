import type { Ref } from "vue";
import { useEventListener } from "@vueuse/core";

/** A text selection resolved to document char offsets, with its selected text. */
export interface SelectionRange {
	start: number;
	end: number;
	text: string;
	/** Viewport rect of the selection, for anchoring a popover. */
	rect: DOMRect;
}

// Resolve a selection boundary (node + offset within it) to a document char
// offset, using the nearest ancestor carrying a `data-start` attribute (the
// segment's char offset in the document). Each segment element holds a single
// text node, so the boundary offset adds directly. Returns null when the
// boundary isn't inside a tagged segment.
function offsetOf(node: Node, offsetInNode: number): number | null {
	const el =
		node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
	const seg = el?.closest<HTMLElement>("[data-start]");
	if (!seg?.dataset.start) return null;
	const base = Number(seg.dataset.start);
	return Number.isFinite(base) ? base + offsetInNode : null;
}

/**
 * Track the user's text selection inside `container` and expose it — as document
 * char offsets — only once it's *settled* (the pointer/key released), never mid-
 * drag. This matters because acting on a live selection (e.g. opening a popover)
 * while it's still being dragged interrupts the drag. Only selections fully
 * inside the container are reported; collapsing or clicking away clears it. The
 * caller converts the char range to byte offsets to build an entity.
 */
export function useSelectionOffset(container: Ref<HTMLElement | null>) {
	const selection = ref<SelectionRange | null>(null);

	function clear() {
		selection.value = null;
	}

	// Read the current selection and resolve it, or null if it isn't a usable
	// span inside the container.
	function read(): SelectionRange | null {
		const root = container.value;
		const sel = window.getSelection();
		if (!root || !sel || sel.isCollapsed || sel.rangeCount === 0) return null;
		const range = sel.getRangeAt(0);
		// Both ends must sit inside the container (ignore selections that spill out).
		if (
			!root.contains(range.startContainer) ||
			!root.contains(range.endContainer)
		) {
			return null;
		}
		const a = offsetOf(range.startContainer, range.startOffset);
		const b = offsetOf(range.endContainer, range.endOffset);
		if (a == null || b == null || a === b) return null;
		return {
			start: Math.min(a, b),
			end: Math.max(a, b),
			text: sel.toString(),
			rect: range.getBoundingClientRect(),
		};
	}

	// Publish the selection only when it settles — on pointer/key release — so a
	// mid-drag change never triggers the consumer.
	function settle() {
		selection.value = read();
	}
	useEventListener(document, "mouseup", settle);
	useEventListener(document, "keyup", settle);

	// Clear as soon as the selection collapses (a click elsewhere), so a stale
	// span doesn't linger after the user dismisses it.
	useEventListener(document, "selectionchange", () => {
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed) clear();
	});

	return { selection, clear };
}
