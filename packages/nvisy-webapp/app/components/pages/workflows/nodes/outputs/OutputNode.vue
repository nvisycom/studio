<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import {
  Download,
  Database,
  HardDrive,
  MessageSquare,
  Waypoints,
} from "lucide-vue-next";

interface Props {
  data: {
    label: string;
    type:
      | "download"
      | "relational_db"
      | "vector_db"
      | "object_store"
      | "message_queue";
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, typeof Download> = {
  download: Download,
  relational_db: Database,
  vector_db: Waypoints,
  object_store: HardDrive,
  message_queue: MessageSquare,
};

const borderColors: Record<string, string> = {
  download: "border-emerald-500/30",
  relational_db: "border-amber-500/30",
  vector_db: "border-indigo-500/30",
  object_store: "border-cyan-500/30",
  message_queue: "border-pink-500/30",
};

const selectedBorderColors: Record<string, string> = {
  download: "border-emerald-500",
  relational_db: "border-amber-500",
  vector_db: "border-indigo-500",
  object_store: "border-cyan-500",
  message_queue: "border-pink-500",
};

const iconColors: Record<string, string> = {
  download: "bg-emerald-500/10 text-emerald-500",
  relational_db: "bg-amber-500/10 text-amber-500",
  vector_db: "bg-indigo-500/10 text-indigo-500",
  object_store: "bg-cyan-500/10 text-cyan-500",
  message_queue: "bg-pink-500/10 text-pink-500",
};

const borderClass = computed(() => {
  const type = props.data?.type || "download";
  return props.selected
    ? selectedBorderColors[type] || "border-emerald-500"
    : borderColors[type] || "border-emerald-500/30";
});

const currentIcon = computed(() => icons[props.data?.type] || Download);
const currentIconColor = computed(
  () => iconColors[props.data?.type] || "bg-emerald-500/10 text-emerald-500",
);
</script>

<template>
  <div
    class="px-5 py-4 rounded-xl border-2 bg-card shadow-sm min-w-[220px] transition-all relative"
    :class="[borderClass, { 'shadow-lg': selected }]"
  >
    <Handle
      type="target"
      :position="Position.Left"
      class="!w-3.5 !h-3.5 !bg-foreground !border-2 !border-background"
    />

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
          Output
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data.label }}
        </div>
      </div>
    </div>
  </div>
</template>
