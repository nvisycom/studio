<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

// Attrs (style, aria, etc.) fall through to the inner <table>, not the wrapping
// container, so callers can size/style the table itself (e.g. a min-width).
defineOptions({ inheritAttrs: false });

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div data-slot="table-container" class="relative w-full overflow-auto">
    <table
      data-slot="table"
      :class="cn('w-full caption-bottom text-sm', props.class)"
      v-bind="$attrs"
    >
      <slot />
    </table>
  </div>
</template>
