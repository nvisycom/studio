<script setup lang="ts">
import type { ContextMenuRootEmits, ContextMenuRootProps } from "reka-ui";
import { ContextMenuRoot, useForwardPropsEmits } from "reka-ui";

const props = defineProps<ContextMenuRootProps>();
const emits = defineEmits<ContextMenuRootEmits>();

// The default slot exposes the menu's `open` state, so callers can
// `v-slot="{ open }"` to react to it (e.g. highlight the row the menu targets).
// ContextMenuRoot supplies `open` to its slot at runtime but leaves it untyped,
// hence the cast in the template.
defineSlots<{ default: (props: { open: boolean }) => unknown }>();

const forwarded = useForwardPropsEmits(props, emits);
</script>

<template>
  <ContextMenuRoot
    v-slot="slots"
    data-slot="context-menu"
    v-bind="forwarded"
  >
    <slot :open="!!(slots as { open?: boolean }).open" />
  </ContextMenuRoot>
</template>
