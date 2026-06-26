<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/utils/shadcn";

defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <h3
    data-slot="empty-title"
    :class="cn('text-sm font-medium text-foreground', $attrs.class ?? '')"
  >
    <slot />
  </h3>
</template>
