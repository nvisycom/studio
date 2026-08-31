<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <!-- The content card: the shell's `[content]` grid track. It floats on the
       chrome-colored shell — the surrounding inset comes from the shell's grid
       tracks and padding, so no margins here. `min-w-0` lets it shrink instead of
       overflowing its track. -->
  <main
    data-slot="sidebar-inset"
    class="sidebar-content bg-background relative flex min-h-0 min-w-0 flex-col overflow-hidden md:rounded-xl md:shadow-sm"
    :class="cn(props.class)"
  >
    <slot />
  </main>
</template>

<style scoped>
.sidebar-content {
  grid-column: content / -1;
}
</style>
