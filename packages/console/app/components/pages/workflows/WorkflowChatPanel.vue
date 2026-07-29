<script setup lang="ts">
import type { Node } from "@vue-flow/core";
import { Send, GripHorizontal, Settings } from "@lucide/vue";
import { Textarea } from "#console/components/ui/textarea";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "#console/components/ui/tabs";
import { getConfigPanelForNodeType } from "./nodeRegistry";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
}

interface Props {
	selectedNode: Node | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
	updateNode: [nodeId: string, data: Record<string, unknown>];
}>();

const activeTab = ref("panel");
const chatMessage = ref("");
const inputHeight = ref(160);
const isResizing = ref(false);
const minInputHeight = 100;
const maxInputHeight = 360;

const chatMessages = ref<ChatMessage[]>([
	{
		id: "1",
		role: "assistant",
		content: "How can I help you with this workflow?",
	},
]);

const configPanel = computed(() => {
	if (!props.selectedNode?.type) return null;
	return getConfigPanelForNodeType(props.selectedNode.type);
});

const hasConfigPanel = computed(() => configPanel.value !== null);

watch(
	() => props.selectedNode?.id,
	(newId, oldId) => {
		if (newId && newId !== oldId && hasConfigPanel.value) {
			activeTab.value = "panel";
		}
	},
);

function handleNodeUpdate(data: Record<string, unknown>) {
	if (props.selectedNode) {
		emit("updateNode", props.selectedNode.id, data);
	}
}

function sendMessage() {
	if (!chatMessage.value.trim()) return;

	chatMessages.value.push({
		id: Date.now().toString(),
		role: "user",
		content: chatMessage.value,
	});

	setTimeout(() => {
		chatMessages.value.push({
			id: `${Date.now() + 1}`,
			role: "assistant",
			content: "I'm processing your request...",
		});
	}, 500);

	chatMessage.value = "";
}

function startResize(e: MouseEvent) {
	isResizing.value = true;
	const startY = e.clientY;
	const startHeight = inputHeight.value;

	function onMouseMove(e: MouseEvent) {
		const delta = startY - e.clientY;
		const newHeight = Math.min(
			Math.max(startHeight + delta, minInputHeight),
			maxInputHeight,
		);
		inputHeight.value = newHeight;
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
  <div
    class="flex flex-col h-full w-full overflow-hidden bg-background border-l border-border"
  >
    <Tabs v-model="activeTab" class="flex flex-col h-full">
      <!-- Tabs Header -->
      <div class="flex-shrink-0 border-b border-border px-3">
        <TabsList class="flex w-full h-10 bg-transparent p-0 gap-0">
          <TabsTrigger
            value="panel"
            class="flex-1 h-full text-[0.8125rem] font-medium text-muted-foreground bg-transparent border-b-2 border-transparent rounded-none data-[state=active]:text-foreground data-[state=active]:border-foreground hover:text-foreground transition-all"
          >
            Panel
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            class="flex-1 h-full text-[0.8125rem] font-medium text-muted-foreground bg-transparent border-b-2 border-transparent rounded-none data-[state=active]:text-foreground data-[state=active]:border-foreground hover:text-foreground transition-all"
          >
            Chat
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Chat Tab -->
      <TabsContent
        value="chat"
        class="flex-1 flex flex-col m-0 min-h-0 data-[state=inactive]:hidden"
      >
        <!-- Chat Messages -->
        <div
          class="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-0"
        >
          <div
            v-for="message in chatMessages"
            :key="message.id"
            :class="[
              'px-3.5 py-2.5 rounded-lg text-[0.8125rem] leading-relaxed break-words',
              message.role === 'user'
                ? 'bg-foreground text-background ml-8'
                : 'bg-muted text-muted-foreground mr-8',
            ]"
          >
            {{ message.content }}
          </div>
        </div>

        <!-- Resize Handle -->
        <div
          class="flex-shrink-0 h-2 border-t border-border cursor-row-resize flex items-center justify-center hover:bg-muted/50 transition-colors"
          @mousedown="startResize"
        >
          <GripHorizontal
            class="w-3 h-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
          />
        </div>

        <!-- Chat Input -->
        <div
          class="flex-shrink-0 relative min-h-0"
          :style="{ height: `${inputHeight}px` }"
        >
          <Textarea
            v-model="chatMessage"
            placeholder="Ask about your workflow..."
            class="h-full w-full border-0 border-t border-border rounded-none focus-visible:ring-0 resize-none pb-12 text-[0.8125rem] bg-background"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <button
            class="absolute bottom-3 right-3 flex items-center justify-center w-7 h-7 bg-foreground text-background rounded-md hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            :disabled="!chatMessage.trim()"
            @click="sendMessage"
          >
            <Send class="w-3.5 h-3.5" />
          </button>
        </div>
      </TabsContent>

      <!-- Panel Tab (Node Config) -->
      <TabsContent
        value="panel"
        class="flex-1 m-0 overflow-y-auto data-[state=inactive]:hidden"
      >
        <!-- Node config when a configurable node is selected -->
        <div v-if="selectedNode && hasConfigPanel" class="p-4">
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-foreground">
              {{ configPanel?.title }}
            </h3>
            <p class="text-xs text-muted-foreground mt-1">
              Configure the selected node
            </p>
          </div>
          <component
            :is="configPanel?.component"
            :data="selectedNode.data"
            @update="handleNodeUpdate"
          />
        </div>

        <!-- Empty state when no configurable node selected -->
        <div
          v-else
          class="flex flex-col items-center justify-center h-full p-6 text-center"
        >
          <div
            class="flex items-center justify-center w-14 h-14 bg-muted/50 rounded-xl text-muted-foreground/50 mb-4"
          >
            <Settings class="w-8 h-8" />
          </div>
          <p class="text-sm font-medium text-muted-foreground">
            Select a node to configure
          </p>
          <p class="text-xs text-muted-foreground/70 mt-1">
            Click a node to edit its settings
          </p>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
