<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Upload, Database, HardDrive, MessageSquare } from "lucide-vue-next";

interface Props {
  data: {
    label: string;
    type: "upload" | "relational_db" | "object_store" | "message_queue";
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, typeof Upload> = {
  upload: Upload,
  relational_db: Database,
  object_store: HardDrive,
  message_queue: MessageSquare,
};

const borderColors: Record<string, string> = {
  upload: "border-blue-500/30",
  relational_db: "border-amber-500/30",
  object_store: "border-cyan-500/30",
  message_queue: "border-pink-500/30",
};

const selectedBorderColors: Record<string, string> = {
  upload: "border-blue-500",
  relational_db: "border-amber-500",
  object_store: "border-cyan-500",
  message_queue: "border-pink-500",
};

const iconColors: Record<string, string> = {
  upload: "bg-blue-500/10 text-blue-500",
  relational_db: "bg-amber-500/10 text-amber-500",
  object_store: "bg-cyan-500/10 text-cyan-500",
  message_queue: "bg-pink-500/10 text-pink-500",
};

const borderClass = computed(() => {
  const type = props.data?.type || "upload";
  return props.selected
    ? selectedBorderColors[type] || "border-blue-500"
    : borderColors[type] || "border-blue-500/30";
});

const currentIcon = computed(() => icons[props.data?.type] || Upload);
const currentIconColor = computed(
  () => iconColors[props.data?.type] || "bg-blue-500/10 text-blue-500",
);
</script>

<template>
  <div
    class="px-5 py-4 rounded-xl border-2 bg-card shadow-sm min-w-[220px] transition-all relative"
    :class="[borderClass, { 'shadow-lg': selected }]"
  >
    <div class="flex items-center gap-4">
      <div
        class="w-10 h-10 rounded-lg flex items-center justify-center"
        :class="currentIconColor"
      >
        <component :is="currentIcon" class="w-5 h-5" />
      </div>
      <div>
        <div
          class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
        >
          Input
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data.label }}
        </div>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />
  </div>
</template>
