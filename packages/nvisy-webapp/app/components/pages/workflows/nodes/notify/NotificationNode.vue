<script setup lang="ts">
import { computed, markRaw } from "vue";
import { Handle, Position } from "@vue-flow/core";
import { Webhook, Mail } from "lucide-vue-next";
import DiscordIcon from "@/components/icons/DiscordIcon.vue";
import SlackIcon from "@/components/icons/SlackIcon.vue";

interface Props {
  data: {
    label: string;
    type: "webhook" | "email" | "slack" | "discord";
  };
  selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, unknown> = {
  webhook: markRaw(Webhook),
  email: markRaw(Mail),
  slack: markRaw(SlackIcon),
  discord: markRaw(DiscordIcon),
};

const borderColors: Record<string, string> = {
  webhook: "border-rose-500/30",
  email: "border-sky-500/30",
  slack: "border-violet-500/30",
  discord: "border-indigo-500/30",
};

const selectedBorderColors: Record<string, string> = {
  webhook: "border-rose-500",
  email: "border-sky-500",
  slack: "border-violet-500",
  discord: "border-indigo-500",
};

const iconColors: Record<string, string> = {
  webhook: "bg-rose-500/10 text-rose-500",
  email: "bg-sky-500/10 text-sky-500",
  slack: "bg-violet-500/10 text-violet-500",
  discord: "bg-indigo-500/10 text-indigo-500",
};

const borderClass = computed(() => {
  const type = props.data?.type || "webhook";
  return props.selected
    ? selectedBorderColors[type] || "border-rose-500"
    : borderColors[type] || "border-rose-500/30";
});

const currentIcon = computed(() => icons[props.data?.type] || Webhook);
const currentIconColor = computed(
  () => iconColors[props.data?.type] || "bg-rose-500/10 text-rose-500",
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
          Notification
        </div>
        <div class="text-base font-semibold text-foreground">
          {{ props.data.label }}
        </div>
      </div>
    </div>
  </div>
</template>
