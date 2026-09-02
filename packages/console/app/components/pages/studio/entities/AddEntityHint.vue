<script setup lang="ts">
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "#console/components/ui/popover";

/**
 * A small, non-modal hint shown when a reviewer selects text / draws a box but
 * adding entities isn't available yet (the detection hasn't completed). Anchored
 * to the selection's rect like {@link AddEntityPopover}, but purely informational:
 * it never blocks the underlying selection (so copy/read still work) and
 * auto-dismisses. The caller clears `rect` when it should go away.
 */
const props = defineProps<{
	/** The frozen viewport rect to anchor to, or null when hidden. */
	rect: DOMRect | null;
	/** The hint text (e.g. "Run detection to add entities"). */
	message: string;
}>();

const emit = defineEmits<{ dismiss: [] }>();

// Anchor that survives the close animation (see useFrozenAnchor): driving open
// straight off `rect` would drop the anchor mid-close and teleport the popover.
const { open, anchor, onClose } = useFrozenAnchor(() => props.rect);

function onOpenChange(next: boolean) {
	if (!next) emit("dismiss");
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverAnchor :reference="anchor" />
    <PopoverContent
      side="bottom"
      align="start"
      :side-offset="6"
      class="w-auto max-w-56 px-2.5 py-1.5 text-xs text-muted-foreground"
      @open-auto-focus.prevent
      @animationend="onClose"
    >
      {{ message }}
    </PopoverContent>
  </Popover>
</template>
