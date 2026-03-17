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

const currentIcon = computed(() => icons[props.data?.type] || Webhook);
</script>

<template>
  <div class="workflow-node" :class="{ 'workflow-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <div class="workflow-node__icon">
      <component :is="currentIcon" class="w-4 h-4" />
    </div>
    <span class="workflow-node__label">{{ props.data.label }}</span>
  </div>
</template>
