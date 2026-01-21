<script setup lang="ts">
import { ref, computed } from "vue";
import { MiniMap } from "@vue-flow/minimap";
import { useVueFlow, type Node } from "@vue-flow/core";
import { Map, X, Plus, Minus } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

import "@vue-flow/minimap/dist/style.css";

const isVisible = ref(true);
const isAnimating = ref(false);

// Get zoom controls from Vue Flow
const { viewport, setViewport } = useVueFlow("workflow-canvas");

// Zoom step for smoother zooming
const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.8;

// Format zoom as percentage
const zoomPercentage = computed(() => {
  return Math.round(viewport.value.zoom * 100);
});

function getNodeColor(node: Node) {
  switch (node.type) {
    case "input":
      return "hsl(217, 91%, 60%)"; // blue
    case "output":
      return "hsl(142, 71%, 45%)"; // green
    default:
      return "hsl(var(--muted-foreground))";
  }
}

function toggleMinimap() {
  if (isAnimating.value) return;

  isAnimating.value = true;
  isVisible.value = !isVisible.value;

  setTimeout(() => {
    isAnimating.value = false;
  }, 200);
}

function handleZoomIn() {
  const newZoom = Math.min(viewport.value.zoom + ZOOM_STEP, MAX_ZOOM);
  setViewport({ ...viewport.value, zoom: newZoom }, { duration: 200 });
}

function handleZoomOut() {
  const newZoom = Math.max(viewport.value.zoom - ZOOM_STEP, MIN_ZOOM);
  setViewport({ ...viewport.value, zoom: newZoom }, { duration: 200 });
}

function handleResetZoom() {
  setViewport({ ...viewport.value, zoom: 1 }, { duration: 200 });
}

const canZoomIn = computed(() => viewport.value.zoom < MAX_ZOOM);
const canZoomOut = computed(() => viewport.value.zoom > MIN_ZOOM);
</script>

<template>
  <div class="absolute bottom-4 left-4 z-10 flex items-end gap-2">
    <!-- Show minimap button when hidden -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-90"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-90"
    >
      <Button
        v-if="!isVisible && !isAnimating"
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0 bg-background shadow-sm border border-border rounded-lg"
        title="Show minimap"
        @click="toggleMinimap"
      >
        <Map class="w-4 h-4" />
      </Button>
    </Transition>

    <!-- Minimap with controls -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-90 origin-bottom-left"
      enter-to-class="opacity-100 scale-100 origin-bottom-left"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 origin-bottom-left"
      leave-to-class="opacity-0 scale-90 origin-bottom-left"
    >
      <div
        v-if="isVisible"
        class="relative rounded-lg overflow-hidden border border-border bg-background"
      >
        <!-- Close button -->
        <button
          class="absolute top-1 right-1 z-10 p-1 bg-background/80 hover:bg-accent rounded transition-colors"
          title="Hide minimap"
          @click="toggleMinimap"
        >
          <X class="w-3 h-3" />
        </button>

        <!-- Minimap -->
        <MiniMap
          pannable
          zoomable
          :node-color="getNodeColor"
          mask-color="rgba(0, 0, 0, 0.08)"
          class="workflow-minimap !relative !bottom-auto !left-auto !m-0 !bg-background"
        />

        <!-- Zoom controls overlay at bottom center -->
        <div
          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-1 py-0.5"
        >
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            title="Zoom out"
            :disabled="!canZoomOut"
            @click="handleZoomOut"
          >
            <Minus class="w-3 h-3" />
          </Button>
          <button
            class="min-w-[2.75rem] h-6 px-1.5 text-xs font-medium text-center hover:bg-accent rounded transition-colors"
            title="Reset zoom to 100%"
            @click="handleResetZoom"
          >
            {{ zoomPercentage }}%
          </button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            title="Zoom in"
            :disabled="!canZoomIn"
            @click="handleZoomIn"
          >
            <Plus class="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.workflow-minimap {
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--background)) !important;
}

.workflow-minimap.vue-flow__minimap {
  background-color: hsl(var(--background)) !important;
}

/* SVG background - use a rect or set fill on the svg itself */
.workflow-minimap svg {
  background-color: hsl(var(--background)) !important;
}

/* The minimap pattern/grid background */
.workflow-minimap .vue-flow__minimap-svg {
  background-color: hsl(var(--background)) !important;
}

/* Override the mask that shows viewport area */
.workflow-minimap .vue-flow__minimap-mask {
  fill: hsl(var(--foreground)) !important;
  fill-opacity: 0.08 !important;
}

/* Ensure the wrapper div has solid background */
:deep(.vue-flow__minimap) {
  background-color: hsl(var(--background)) !important;
}
</style>
