<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import {
	Download,
	Database,
	HardDrive,
	MessageSquare,
	Waypoints,
	DatabaseZap,
} from "lucide-vue-next";

interface Props {
	data: {
		label: string;
		type:
			| "download"
			| "relational_db"
			| "vector_db"
			| "cache"
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
	cache: DatabaseZap,
	object_store: HardDrive,
	message_queue: MessageSquare,
};

const currentIcon = computed(() => icons[props.data?.type] || Download);
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
