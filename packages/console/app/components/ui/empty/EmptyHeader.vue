<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="empty-header"
    :class="
      cn(
        'flex max-w-md flex-col items-center gap-1 text-center',
        $attrs.class ?? '',
      )
    "
  >
    <slot />
  </div>
</template>
