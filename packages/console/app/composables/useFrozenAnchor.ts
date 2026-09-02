import type { MaybeRefOrGetter, Ref } from "vue";

/**
 * A virtual anchor for a popover/hint driven by a viewport `rect`, whose reference
 * stays stable through the close animation.
 *
 * The naive `:open="!!rect"` + `anchor from rect` pattern teleports on dismiss:
 * clearing the rect nulls the anchor *while the popover is still animating out*, so
 * the popper repositions against nothing and jumps to a corner. This keeps the
 * last rect for the anchor until the popover has fully closed — `open` follows the
 * rect, but `anchor` is only dropped once closed — so the content slides out in
 * place.
 *
 * Call `onClosed()` from the content's close-animation end (or when its open state
 * settles to false) to release the retained rect.
 */
export function useFrozenAnchor(rect: MaybeRefOrGetter<DOMRect | null>): {
	open: Ref<boolean>;
	anchor: Ref<{ getBoundingClientRect: () => DOMRect } | undefined>;
	onClose: () => void;
} {
	const open = ref(false);
	// The rect the anchor resolves to. Retained while closing; overwritten on the
	// next open. (Even without an explicit release it's harmless — a closed popover
	// isn't positioned — but `onClose` lets a caller drop it deterministically.)
	const anchorRect = ref<DOMRect | null>(null);

	watch(
		() => toValue(rect),
		(next) => {
			if (next) anchorRect.value = next;
			open.value = !!next;
		},
		{ immediate: true },
	);

	const anchor = computed(() =>
		anchorRect.value
			? { getBoundingClientRect: () => anchorRect.value as DOMRect }
			: undefined,
	);

	function onClose() {
		if (!open.value) anchorRect.value = null;
	}

	return { open, anchor, onClose };
}
