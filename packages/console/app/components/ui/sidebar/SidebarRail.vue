<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "#console/utils/shadcn";
import { useSidebar } from "./utils";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();

const { toggleSidebar } = useSidebar();
</script>

<template>
  <!-- The toggle rail lives in the shell's `[rail]` grid track, so it's centered
       in the sidebar/content gap and spans the full row height by construction —
       no positioning. Its hover line is a centered pseudo-element that lights up
       on hover. -->
  <button
    data-slot="sidebar-rail"
    data-sidebar="rail"
    aria-label="Toggle Sidebar"
    title="Toggle Sidebar"
    :tabindex="-1"
    :class="cn('sidebar-rail group/rail', props.class)"
    @click="toggleSidebar"
  >
    <span class="sidebar-rail-line" />
  </button>
</template>

<style scoped>
.sidebar-rail {
  grid-column: rail / content;
  align-self: stretch;
  display: none;
  /* Line hugs the content side of the gap (right), inset from the very top and
     bottom so it doesn't reach the card's rounded corners. */
  align-items: stretch;
  justify-content: flex-end;
  padding-block: 0.5rem;
  cursor: col-resize;
}
@media (min-width: 768px) {
  .sidebar-rail {
    display: flex;
  }
}
.sidebar-rail-line {
  width: 2px;
  border-radius: 9999px;
  background-color: transparent;
  transition: background-color 150ms ease;
}
.sidebar-rail:hover .sidebar-rail-line {
  background-color: var(--sidebar-border);
}
</style>
