<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { Node } from "@vue-flow/core";
import { GripVertical } from "lucide-vue-next";
import { WorkflowCanvas } from "~/components/pages/workflows";
import WorkflowChatPanel from "~/components/pages/workflows/WorkflowChatPanel.vue";

useHead({ title: "Editor" });

definePageMeta({
	pageCategory: "Automation",
});

// Ensure at least one workflow is open
const { ensureWorkflowOpen } = useEditorWorkflows();
onMounted(() => {
	ensureWorkflowOpen();
});

// Canvas ref
const canvasRef = ref<InstanceType<typeof WorkflowCanvas> | null>(null);

// Chat panel state
const chatVisible = ref(true);
const chatWidth = ref(400);
const savedChatWidth = ref(400);
const isAnimating = ref(false);
const isResizing = ref(false);

// Selected node for config panel
const selectedConfigNode = ref<Node | null>(null);

const minChatWidth = 320;
const maxChatWidth = 800;

function toggleChat() {
	if (isAnimating.value) return;

	isAnimating.value = true;

	if (chatVisible.value) {
		// Save current width before closing
		savedChatWidth.value = chatWidth.value;
		chatWidth.value = 0;
		setTimeout(() => {
			chatVisible.value = false;
			isAnimating.value = false;
		}, 300);
	} else {
		// Restore saved width
		chatVisible.value = true;
		nextTick(() => {
			chatWidth.value = savedChatWidth.value;
			setTimeout(() => {
				isAnimating.value = false;
			}, 300);
		});
	}
}

function handleSelectConfigNode(node: Node | null) {
	selectedConfigNode.value = node;
}

function handleUpdateNode(nodeId: string, data: Record<string, unknown>) {
	canvasRef.value?.updateNodeData(nodeId, data);
}

// Resize handling
function startResize(e: MouseEvent) {
	if (isAnimating.value) return;

	isResizing.value = true;
	const startX = e.clientX;
	const startWidth = chatWidth.value;

	function onMouseMove(e: MouseEvent) {
		const delta = startX - e.clientX;
		const newWidth = Math.min(
			Math.max(startWidth + delta, minChatWidth),
			maxChatWidth,
		);
		chatWidth.value = newWidth;
	}

	function onMouseUp() {
		isResizing.value = false;
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
	}

	document.addEventListener("mousemove", onMouseMove);
	document.addEventListener("mouseup", onMouseUp);
}
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-muted/30 flex">
    <!-- Canvas -->
    <div class="flex-1 min-w-0 h-full">
      <WorkflowCanvas
        ref="canvasRef"
        :chat-visible="chatVisible"
        @toggle-chat="toggleChat"
        @select-config-node="handleSelectConfigNode"
      />
    </div>

    <!-- Chat Panel with Resize Handle -->
    <div
      class="h-full flex overflow-hidden"
      :class="{ 'transition-[width] duration-300 ease-in-out': !isResizing }"
      :style="{ width: chatVisible || isAnimating ? `${chatWidth}px` : '0px' }"
    >
      <!-- Resize Handle -->
      <div
        v-if="chatVisible"
        class="w-px h-full cursor-col-resize flex items-center justify-center bg-border relative after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 flex-shrink-0 group"
        @mousedown="startResize"
      >
        <div
          class="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border"
        >
          <GripVertical class="size-2.5" />
        </div>
      </div>

      <!-- Chat Content -->
      <div
        v-if="chatVisible || isAnimating"
        class="flex-1 h-full min-w-0 overflow-hidden"
      >
        <WorkflowChatPanel
          :selected-node="selectedConfigNode"
          @update-node="handleUpdateNode"
        />
      </div>
    </div>
  </div>
</template>
