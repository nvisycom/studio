<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Languages } from "lucide-vue-next";

interface LanguageConfig {
  id: string;
  label: string;
  code: string;
  enabled: boolean;
}

interface Props {
  data: {
    label: string;
    languages: LanguageConfig[];
    invertMode?: boolean;
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const enabledLanguages = computed(() => {
  return props.data?.languages?.filter((lang) => lang.enabled) || [];
});

const displayLimit = 3;
const displayedLanguages = computed(() =>
  enabledLanguages.value.slice(0, displayLimit),
);
const remainingCount = computed(() =>
  Math.max(0, enabledLanguages.value.length - displayLimit),
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
    :class="[selected ? 'border-teal-500 shadow-lg' : 'border-teal-500/30']"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />

    <div class="flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-500/10 text-teal-500"
      >
        <Languages class="w-5 h-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Flow
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data?.label || "Language Switch" }}
        </div>
      </div>
    </div>

    <!-- Language labels -->
    <div
      v-if="enabledLanguages.length > 0"
      class="mt-3 flex flex-wrap gap-1.5 max-w-[180px]"
    >
      <span
        v-if="invertMode"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        NOT
      </span>
      <span
        v-for="lang in displayedLanguages"
        :key="lang.id"
        class="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400"
      >
        {{ lang.code.toUpperCase() }}
      </span>
      <span
        v-if="remainingCount > 0"
        class="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground"
      >
        +{{ remainingCount }}
      </span>
    </div>

    <!-- Dynamic output handles for each enabled language -->
    <Handle
      v-for="(lang, index) in enabledLanguages"
      :id="lang.id"
      :key="lang.id"
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !bg-teal-500 !border-2 !border-background"
      :style="getHandleStyle(index, enabledLanguages.length)"
    />
  </div>
</template>
