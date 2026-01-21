<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import {
  FileSearch,
  Table,
  Languages,
  Sparkles,
  FileJson,
  GitBranch,
  Workflow,
} from "lucide-vue-next";

interface Props {
  data: {
    label: string;
    type:
      | "ocr"
      | "table"
      | "translate"
      | "summarize"
      | "extract"
      | "transform"
      | "custom";
    description?: string;
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, typeof FileSearch> = {
  ocr: FileSearch,
  table: Table,
  translate: Languages,
  summarize: Sparkles,
  extract: FileJson,
  transform: GitBranch,
  custom: Workflow,
};

const currentIcon = computed(() => icons[props.data?.type] || Workflow);
</script>

<template>
  <div
    class="px-5 py-4 rounded-xl border-2 bg-card shadow-sm min-w-[220px] transition-all relative"
    :class="[selected ? 'border-foreground shadow-lg' : 'border-border']"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />

    <div class="flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center bg-foreground/10"
      >
        <component :is="currentIcon" class="w-5 h-5 text-foreground" />
      </div>
      <div>
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Process
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data.label }}
        </div>
      </div>
    </div>

    <p v-if="props.data.description" class="mt-2 text-sm text-muted-foreground">
      {{ props.data.description }}
    </p>

    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />
  </div>
</template>
