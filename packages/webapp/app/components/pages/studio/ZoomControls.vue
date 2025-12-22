<script setup lang="ts">
import { ZoomIn, ZoomOut } from "lucide-vue-next";
import { Button } from "@/components/ui/button";

interface Props {
	zoomLevel?: number;
}

interface Emits {
	(e: "zoomIn"): void;
	(e: "zoomOut"): void;
}

const props = withDefaults(defineProps<Props>(), {
	zoomLevel: 100,
});

const emit = defineEmits<Emits>();

function zoomIn() {
	emit("zoomIn");
}

function zoomOut() {
	emit("zoomOut");
}
</script>

<template>
  <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
    <div
      class="flex items-center gap-2 bg-white dark:bg-neutral-900 px-3 py-2 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-800"
    >
      <Button variant="outline" size="sm" @click="zoomOut">
        <ZoomOut :size="16" />
      </Button>
      <span class="text-sm font-medium min-w-[60px] text-center">
        {{ zoomLevel }}%
      </span>
      <Button variant="outline" size="sm" @click="zoomIn">
        <ZoomIn :size="16" />
      </Button>
    </div>
  </div>
</template>
