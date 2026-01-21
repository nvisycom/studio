<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Split } from "lucide-vue-next";

interface ExtensionConfig {
  id: string;
  label: string;
  enabled: boolean;
}

interface Props {
  data: {
    label: string;
    extensions: ExtensionConfig[];
    invertMode?: boolean;
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const enabledExtensions = computed(() => {
  return props.data?.extensions?.filter((ext) => ext.enabled) || [];
});

const displayLimit = 3;
const displayedExtensions = computed(() =>
  enabledExtensions.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
  Math.max(0, enabledExtensions.value.length - displayLimit),
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
    :class="[selected ? 'border-orange-500 shadow-lg' : 'border-orange-500/30']"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />

    <div class="flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-500/10 text-orange-500"
      >
        <Split class="w-5 h-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Flow
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data?.label || "Extension Switch" }}
        </div>
      </div>
    </div>

    <!-- Extension labels -->
    <div
      v-if="enabledExtensions.length > 0"
      class="mt-3 flex flex-wrap gap-1.5 max-w-[180px]"
    >
      <span
        v-if="invertMode"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        NOT
      </span>
      <span
        v-for="ext in displayedExtensions"
        :key="ext.id"
        class="text-xs font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400"
      >
        .{{ ext.label }}
      </span>
      <span
        v-if="remainingCount > 0"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        +{{ remainingCount }}
      </span>
    </div>

    <!-- Dynamic output handles for each enabled extension -->
    <Handle
      v-for="(ext, index) in enabledExtensions"
      :id="ext.id"
      :key="ext.id"
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-background"
      :style="getHandleStyle(index, enabledExtensions.length)"
    />
  </div>
</template>
