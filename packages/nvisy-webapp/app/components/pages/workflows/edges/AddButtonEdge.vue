<script setup lang="ts">
import { computed, inject } from "vue";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@vue-flow/core";
import { Plus } from "lucide-vue-next";
import type { Position } from "../types";

interface Props {
	id: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	sourcePosition: string;
	targetPosition: string;
	sourceNode: { id: string };
	targetNode: { id: string };
	markerEnd?: string;
	style?: Record<string, unknown>;
	selected?: boolean;
}

const props = defineProps<Props>();

const onEdgeAddNode =
	inject<
		(
			edgeId: string,
			position: Position,
			sourceNodeId: string,
			targetNodeId: string,
		) => void
	>("onEdgeAddNode");

const path = computed(() =>
	getBezierPath({
		sourceX: props.sourceX,
		sourceY: props.sourceY,
		targetX: props.targetX,
		targetY: props.targetY,
		sourcePosition: props.sourcePosition as any,
		targetPosition: props.targetPosition as any,
	}),
);

const edgePath = computed(() => path.value[0]);
const labelX = computed(() => path.value[1]);
const labelY = computed(() => path.value[2]);

function handleAddClick(event: MouseEvent) {
	event.stopPropagation();
	if (onEdgeAddNode) {
		onEdgeAddNode(
			props.id,
			{ x: labelX.value, y: labelY.value },
			props.sourceNode.id,
			props.targetNode.id,
		);
	}
}
</script>

<template>
  <BaseEdge :id="id" :path="edgePath" :marker-end="markerEnd" :style="style" />
  <EdgeLabelRenderer>
    <div
      class="absolute nodrag nopan"
      :style="{
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }"
    >
      <button
        type="button"
        class="w-5 h-5 rounded-full flex items-center justify-center bg-muted-foreground text-background shadow-sm hover:bg-foreground hover:scale-110 transition-all cursor-pointer"
        title="Add node"
        @click="handleAddClick"
      >
        <Plus class="w-3 h-3" />
      </button>
    </div>
  </EdgeLabelRenderer>
</template>
