<script setup lang="ts">
import { ref, computed } from "vue";
import { MiniMap } from "@vue-flow/minimap";
import { useVueFlow, type GraphNode } from "@vue-flow/core";
import { MapIcon, X, Plus, Minus } from "@lucide/vue";

import "@vue-flow/minimap/dist/style.css";

const isVisible = ref(true);
const isAnimating = ref(false);

const { viewport, setViewport } = useVueFlow("workflow-canvas");

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 2.8;

const zoomPercentage = computed(() => {
	return Math.round(viewport.value.zoom * 100);
});

// Color nodes based on their type
function getNodeColor(node: GraphNode): string {
	const type = node.type;
	if (type === "input") {
		// Input nodes - slightly darker
		return "var(--muted-foreground)";
	}
	if (type === "output" || type === "notification") {
		// Output nodes - lighter
		return "var(--border)";
	}
	// Process/switch nodes - default
	return "var(--muted)";
}

function getNodeStrokeColor(node: GraphNode): string {
	const type = node.type;
	if (type === "input") {
		return "var(--foreground)";
	}
	if (type === "output" || type === "notification") {
		return "var(--muted-foreground)";
	}
	return "var(--muted-foreground)";
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
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <button
        v-if="!isVisible && !isAnimating"
        class="flex items-center justify-center w-8 h-8 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-muted-foreground hover:bg-card hover:text-foreground transition-all cursor-pointer"
        title="Show minimap"
        @click="toggleMinimap"
      >
        <MapIcon class="w-3.5 h-3.5" />
      </button>
    </Transition>

    <!-- Minimap with controls -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95 origin-bottom-left"
      enter-to-class="opacity-100 scale-100 origin-bottom-left"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 origin-bottom-left"
      leave-to-class="opacity-0 scale-95 origin-bottom-left"
    >
      <div
        v-if="isVisible"
        class="relative bg-card/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden"
      >
        <!-- Close button -->
        <button
          class="absolute top-1.5 right-1.5 z-10 flex items-center justify-center w-5 h-5 bg-card/80 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
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
          :node-stroke-color="getNodeStrokeColor"
          :node-stroke-width="1"
          :node-border-radius="2"
          mask-color="rgba(0, 0, 0, 0.04)"
          class="workflow-minimap !relative !bottom-auto !left-auto !m-0"
        />

        <!-- Zoom controls -->
        <div
          class="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-0 bg-card/95 backdrop-blur-sm border border-border rounded-md p-0.5"
        >
          <button
            class="flex items-center justify-center w-6 h-6 text-muted-foreground rounded hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Zoom out"
            :disabled="!canZoomOut"
            @click="handleZoomOut"
          >
            <Minus class="w-3 h-3" />
          </button>
          <button
            class="min-w-10 h-6 px-1.5 text-[0.6875rem] font-medium font-mono text-muted-foreground text-center rounded hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            title="Reset zoom to 100%"
            @click="handleResetZoom"
          >
            {{ zoomPercentage }}%
          </button>
          <button
            class="flex items-center justify-center w-6 h-6 text-muted-foreground rounded hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Zoom in"
            :disabled="!canZoomIn"
            @click="handleZoomIn"
          >
            <Plus class="w-3 h-3" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.workflow-minimap {
  background-color: transparent !important;
  border-radius: 0.5rem;
}

.workflow-minimap svg {
  background-color: transparent !important;
}

.workflow-minimap .vue-flow__minimap-mask {
  fill: var(--foreground) !important;
  fill-opacity: 0.04 !important;
}
</style>
