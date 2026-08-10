<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { TableHead } from "#console/components/ui/table";
import { cn } from "#console/utils/shadcn";

/**
 * A table header cell carrying the shared column-header styling
 * (uppercase, small, tracked). Extra classes — widths, min-widths — merge on
 * top via `cn`.
 */
const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <TableHead
    :class="cn('uppercase text-xs font-normal tracking-wider', props.class)"
  >
    <slot />
  </TableHead>
</template>
