<script setup lang="ts">
import type { Component } from "vue";
import {
	Send,
	ChevronDown,
	Maximize2,
	Split,
	Merge,
	Edit3,
	FileOutput,
	Highlighter,
	MessageSquare,
	GripHorizontal,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
}

interface Layer {
	id: string;
	name: string;
	icon: Component;
	page: number;
	fileName: string;
}

const { t } = useI18n();
const { getKbdKey } = useKbd();

const chatMessage = ref("");
const changesOpen = ref(false);
const selectedTool = ref<string | null>(null);
const inputHeight = ref(200);
const isResizing = ref(false);
const minInputHeight = 150;
const maxInputHeight = 500;

const tools = computed(() => [
	{
		id: "highlight",
		name: t("studio.chat.tools.highlight"),
		icon: Highlighter,
		shortcut: "H",
	},
	{
		id: "annotate",
		name: t("studio.chat.tools.annotate"),
		icon: MessageSquare,
		shortcut: "N",
	},
]);

function selectTool(toolId: string) {
	selectedTool.value = selectedTool.value === toolId ? null : toolId;
}

const chatMessages = ref<ChatMessage[]>([
	{
		id: "1",
		role: "assistant",
		content: "How can I help you with this document?",
	},
]);

const layers = ref<Layer[]>([
	{ id: "1", name: "Split", icon: Split, page: 1, fileName: "contract.pdf" },
	{ id: "2", name: "Edit", icon: Edit3, page: 2, fileName: "invoice.pdf" },
	{
		id: "3",
		name: "Extract",
		icon: FileOutput,
		page: 3,
		fileName: "report.pdf",
	},
	{ id: "4", name: "Merge", icon: Merge, page: 4, fileName: "document.pdf" },
]);

function selectChange(layerId: string) {
	console.log("Reviewing change:", layerId);
}

function deleteLayer(layerId: string) {
	const index = layers.value.findIndex((l) => l.id === layerId);
	if (index !== -1) {
		layers.value.splice(index, 1);
	}
}

function acceptChange(layerId: string) {
	deleteLayer(layerId);
}

function rejectChange(layerId: string) {
	deleteLayer(layerId);
}

function acceptAllChanges() {
	layers.value = [];
	changesOpen.value = false;
}

function rejectAllChanges() {
	layers.value = [];
	changesOpen.value = false;
}

// Keyboard shortcuts
defineShortcuts({
	meta_shift_a: () => {
		if (layers.value.length > 0) acceptAllChanges();
	},
	meta_shift_r: () => {
		if (layers.value.length > 0) rejectAllChanges();
	},
	meta_shift_h: () => selectTool("highlight"),
	meta_shift_n: () => selectTool("annotate"),
});

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

// Resize handling
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
    class="flex flex-col h-full w-full overflow-hidden bg-background border-l"
  >
    <!-- Chat Messages -->
    <div
      class="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 min-h-0 min-w-0"
    >
      <div
        v-for="message in chatMessages"
        :key="message.id"
        :class="[
          'p-2.5 rounded-lg text-sm font-normal break-words overflow-hidden max-w-full',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground ml-8'
            : 'bg-muted/50 text-muted-foreground mr-8',
        ]"
      >
        {{ message.content }}
      </div>
    </div>

    <!-- Resize Handle -->
    <div
      class="flex-shrink-0 h-2 border-t cursor-row-resize flex items-center justify-center hover:bg-muted/50 transition-colors group"
      @mousedown="startResize"
    >
      <GripHorizontal
        :size="12"
        class="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors"
      />
    </div>

    <!-- Bottom Section (resizable) -->
    <div
      class="flex-shrink-0 flex flex-col overflow-hidden"
      :style="{ height: `${inputHeight}px` }"
    >
      <!-- Changes Section -->
      <div
        class="flex flex-col"
        :class="
          changesOpen ? 'flex-shrink min-h-0 max-h-[50%]' : 'flex-shrink-0'
        "
      >
        <!-- Header with Accept All / Reject All -->
        <div class="flex items-center justify-between pt-1 px-2 pb-1.5">
          <button
            class="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
            @click="changesOpen = !changesOpen"
          >
            <span class="text-xs font-normal">{{
              t("studio.chat.changes.title")
            }}</span>
            <span class="text-[10px] font-normal text-muted-foreground"
              >({{ layers.length }})</span
            >
            <ChevronDown
              :size="12"
              class="transition-transform duration-200"
              :class="{ 'rotate-180': changesOpen }"
            />
          </button>
          <div class="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              class="h-6 text-xs font-normal px-2 gap-1"
              :disabled="layers.length === 0"
              @click="rejectAllChanges"
            >
              {{ t("studio.chat.changes.rejectAll") }}
              <div class="flex items-center gap-0.5 ml-1">
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("meta")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("shift")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">R</Kbd>
              </div>
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="h-6 text-xs font-normal px-2 gap-1"
              :disabled="layers.length === 0"
              @click="acceptAllChanges"
            >
              {{ t("studio.chat.changes.acceptAll") }}
              <div class="flex items-center gap-0.5 ml-1">
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("meta")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("shift")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">A</Kbd>
              </div>
            </Button>
          </div>
        </div>

        <!-- Collapsible Changes list -->
        <div
          v-if="changesOpen && layers.length > 0"
          class="px-3 pb-2 overflow-y-auto min-h-0 flex-1"
        >
          <div class="space-y-1.5">
            <div
              v-for="layer in layers"
              :key="layer.id"
              class="p-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted/70 transition-colors"
              @click="selectChange(layer.id)"
            >
              <div class="flex items-center gap-2">
                <component :is="layer.icon" :size="14" class="flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-normal truncate">{{ layer.name }}</p>
                  <p
                    class="text-[10px] font-normal text-muted-foreground truncate"
                  >
                    {{ layer.fileName }} · Page {{ layer.page }}
                  </p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-6 text-xs font-normal px-2"
                    @click.stop="rejectChange(layer.id)"
                  >
                    {{ t("studio.chat.changes.reject") }}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-6 text-xs font-normal px-2"
                    @click.stop="acceptChange(layer.id)"
                  >
                    {{ t("studio.chat.changes.accept") }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state when no changes -->
        <div v-else-if="changesOpen && layers.length === 0" class="px-3 pb-2">
          <p class="text-xs text-muted-foreground text-center py-2">
            {{ t("studio.chat.changes.empty") }}
          </p>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="flex-1 relative min-h-0">
        <Textarea
          v-model="chatMessage"
          :placeholder="t('studio.chat.placeholder')"
          class="h-full w-full rounded-none border-0 border-t focus-visible:ring-0 resize-none break-words pb-12 text-sm font-normal"
          @keydown.enter.prevent="sendMessage"
        />

        <!-- Action bar inside textarea area -->
        <div
          class="absolute bottom-2 left-2 right-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-1">
            <Button
              v-for="tool in tools"
              :key="tool.id"
              :variant="selectedTool === tool.id ? 'default' : 'outline'"
              size="sm"
              class="h-7 px-2 gap-1 cursor-pointer"
              :title="`${tool.name} (${getKbdKey('meta')}${getKbdKey('shift')}${tool.shortcut})`"
              @click="selectTool(tool.id)"
            >
              <component :is="tool.icon" :size="14" />
              <div class="flex items-center gap-0.5">
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("meta")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">{{
                  getKbdKey("shift")
                }}</Kbd>
                <Kbd class="text-[10px] h-4 min-w-4">{{ tool.shortcut }}</Kbd>
              </div>
            </Button>
          </div>
          <div class="flex items-center gap-1">
            <Button
              as-child
              variant="outline"
              size="sm"
              class="h-7 w-7 p-0 cursor-pointer"
            >
              <NuxtLink to="/files/chat" title="Open full chat">
                <Maximize2 :size="14" />
              </NuxtLink>
            </Button>
            <Button
              size="sm"
              class="h-7 w-7 p-0 cursor-pointer"
              :disabled="!chatMessage.trim()"
              @click="sendMessage"
            >
              <Send :size="14" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
