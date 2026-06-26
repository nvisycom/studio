<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <p
    data-slot="card-description"
    :class="cn('text-muted-foreground text-sm font-normal', props.class)"
  >
    <slot />
  </p>
</template>
