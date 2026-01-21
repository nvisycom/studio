<script setup lang="ts">
import { Handle, Position } from "@vue-flow/core";
import { Link } from "lucide-vue-next";

interface Props {
	data: {
		label: string;
		slotName?: string;
	};
	selected?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="workflow-node" :class="{ 'workflow-node--selected': selected }">
    <Handle type="target" :position="Position.Left" />
    <div class="workflow-node__icon">
      <Link class="w-4 h-4" />
    </div>
    <span class="workflow-node__label">{{ props.data.label }}</span>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>
