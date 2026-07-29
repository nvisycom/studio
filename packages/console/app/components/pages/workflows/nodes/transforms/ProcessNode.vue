<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import {
	FileSearch,
	Table,
	Sparkles,
	FileJson,
	GitBranch,
	Workflow,
} from "@lucide/vue";

interface Props {
	data: {
		label: string;
		type: "partition" | "chunk" | "embed" | "extract" | "transform" | "custom";
		description?: string;
	};
	selected?: boolean;
}

const props = defineProps<Props>();

const icons: Record<string, typeof FileSearch> = {
	partition: FileSearch,
	chunk: Table,
	embed: Sparkles,
	extract: FileJson,
	transform: GitBranch,
	custom: Workflow,
};

const currentIcon = computed(() => icons[props.data?.type] || Workflow);
</script>

<template>
  <div class="workflow-node" :class="{ 'workflow-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <div class="workflow-node__icon">
      <component :is="currentIcon" class="w-4 h-4" />
    </div>
    <span class="workflow-node__label">{{ props.data.label }}</span>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
