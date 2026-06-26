<script setup lang="ts">
import { computed } from "vue";
import { Handle, Position } from "@vue-flow/core";
import {
	Upload,
	Database,
	HardDrive,
	MessageSquare,
	BookOpen,
	DatabaseZap,
} from "@lucide/vue";

interface Props {
	data: {
		label: string;
		type:
			| "upload"
			| "context"
			| "cache"
			| "relational_db"
			| "object_store"
			| "message_queue";
	};
	selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, typeof Upload> = {
	upload: Upload,
	context: BookOpen,
	cache: DatabaseZap,
	relational_db: Database,
	object_store: HardDrive,
	message_queue: MessageSquare,
};

const currentIcon = computed(() => icons[props.data?.type] || Upload);
</script>

<template>
  <div class="workflow-node" :class="{ 'workflow-node--selected': selected }">
    <div class="workflow-node__icon">
      <component :is="currentIcon" class="w-4 h-4" />
    </div>
    <span class="workflow-node__label">{{ props.data.label }}</span>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
