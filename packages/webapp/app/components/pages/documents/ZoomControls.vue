<script setup lang="ts">
import {
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";

interface Props {
  zoomLevel?: number;
  chatVisible?: boolean;
}

interface Emits {
  (e: "zoomIn"): void;
  (e: "zoomOut"): void;
  (e: "toggleChat"): void;
}

const props = withDefaults(defineProps<Props>(), {
  zoomLevel: 100,
  chatVisible: true,
});

const emit = defineEmits<Emits>();

function zoomIn() {
  emit("zoomIn");
}

function zoomOut() {
  emit("zoomOut");
}

function toggleChat() {
  emit("toggleChat");
}
</script>

<template>
  <div class="absolute bottom-6 left-0 right-0 z-20 px-6">
    <div class="flex items-center justify-center">
      <!-- Zoom Controls (centered) -->
      <div
        class="flex items-center gap-1 bg-white dark:bg-neutral-900 px-2 py-1.5 rounded-md shadow-lg border border-neutral-200 dark:border-neutral-800"
      >
        <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="zoomOut">
          <ZoomOut :size="14" />
        </Button>
        <span class="text-xs font-medium min-w-[44px] text-center">
          {{ zoomLevel }}%
        </span>
        <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="zoomIn">
          <ZoomIn :size="14" />
        </Button>
      </div>
    </div>

    <!-- Chat Toggle (bottom right) -->
    <div class="absolute right-6 top-0">
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 rounded-md"
        @click="toggleChat"
      >
        <PanelRightClose v-if="chatVisible" :size="14" />
        <PanelRightOpen v-else :size="14" />
      </Button>
    </div>
  </div>
</template>
