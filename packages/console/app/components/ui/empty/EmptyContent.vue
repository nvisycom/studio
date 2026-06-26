<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="empty-content"
    :class="
      cn(
        'flex w-full min-w-0 max-w-md flex-col items-center gap-3 text-balance text-sm',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
