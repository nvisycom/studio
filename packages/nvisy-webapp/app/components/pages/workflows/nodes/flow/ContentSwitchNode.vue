<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { FileType } from "lucide-vue-next";

interface ContentTypeConfig {
  id: string;
  label: string;
  enabled: boolean;
}

interface Props {
  data: {
    label: string;
    contentTypes: ContentTypeConfig[];
    invertMode?: boolean;
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const enabledContentTypes = computed(() => {
  return props.data?.contentTypes?.filter((ct) => ct.enabled) || [];
});

const displayLimit = 3;
const displayedContentTypes = computed(() =>
  enabledContentTypes.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
  Math.max(0, enabledContentTypes.value.length - displayLimit),
);

const invertMode = computed(() => props.data?.invertMode ?? false);

// Calculate vertical position for each handle
function getHandleStyle(index: number, total: number) {
  if (total === 1) {
    return { top: "50%" };
  }
  // Distribute handles evenly with padding
  const padding = 20; // percentage from top/bottom
  const availableSpace = 100 - padding * 2;
  const position = padding + (availableSpace / (total - 1)) * index;
  return { top: `${position}%` };
}
</script>

<template>
  <div
    class="px-5 py-4 rounded-xl border-2 bg-card shadow-sm min-w-[220px] transition-all relative"
    :class="[selected ? 'border-purple-500 shadow-lg' : 'border-purple-500/30']"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />

    <div class="flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/10 text-purple-500"
      >
        <FileType class="w-5 h-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Flow
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data?.label || "Content Switch" }}
        </div>
      </div>
    </div>

    <!-- Content type labels -->
    <div
      v-if="enabledContentTypes.length > 0"
      class="mt-3 flex flex-wrap gap-1.5 max-w-[180px]"
    >
      <span
        v-if="invertMode"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        NOT
      </span>
      <span
        v-for="ct in displayedContentTypes"
        :key="ct.id"
        class="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400"
      >
        {{ ct.label }}
      </span>
      <span
        v-if="remainingCount > 0"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        +{{ remainingCount }}
      </span>
    </div>

    <!-- Dynamic output handles for each enabled content type -->
    <Handle
      v-for="(ct, index) in enabledContentTypes"
      :id="ct.id"
      :key="ct.id"
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !bg-purple-500 !border-2 !border-background"
      :style="getHandleStyle(index, enabledContentTypes.length)"
    />
  </div>
</template>
