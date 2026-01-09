<script setup lang="ts">
import type { Component } from "vue";
import {
  Send,
  ChevronDown,
  Layers,
  Maximize2,
  Split,
  Merge,
  Edit3,
  FileOutput,
  Highlighter,
  MessageSquare,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

const chatMessage = ref("");
const changesOpen = ref(false);
const selectedTool = ref<string | null>(null);

const tools = [
  { id: "highlight", name: "Highlight", icon: Highlighter },
  { id: "annotate", name: "Annotate", icon: MessageSquare },
];

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
          'p-2.5 rounded-lg text-sm font-light break-all overflow-hidden max-w-full',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground ml-8'
            : 'bg-muted/50 text-muted-foreground mr-8',
        ]"
      >
        {{ message.content }}
      </div>
    </div>

    <!-- Changes Section -->
    <div class="flex-shrink-0 border-t">
      <!-- Header with Accept All / Reject All -->
      <div class="flex items-center justify-between p-2 px-3">
        <button
          class="flex items-center gap-2 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
          @click="changesOpen = !changesOpen"
        >
          <Layers :size="14" />
          <span class="text-sm font-light">Changes</span>
          <span class="text-xs font-light text-muted-foreground"
            >({{ layers.length }})</span
          >
          <ChevronDown
            :size="14"
            class="transition-transform duration-200"
            :class="{ 'rotate-180': changesOpen }"
          />
        </button>
        <div class="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            class="h-6 text-xs font-light px-2"
            :disabled="layers.length === 0"
            @click="rejectAllChanges"
          >
            Reject All
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="h-6 text-xs font-light px-2"
            :disabled="layers.length === 0"
            @click="acceptAllChanges"
          >
            Accept All
          </Button>
        </div>
      </div>

      <!-- Collapsible Changes list -->
      <div v-if="changesOpen && layers.length > 0" class="px-3 pb-2">
        <div class="max-h-[200px] overflow-y-auto">
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
                  <p class="text-sm font-light truncate">{{ layer.name }}</p>
                  <p
                    class="text-[10px] font-light text-muted-foreground truncate"
                  >
                    {{ layer.fileName }} · Page {{ layer.page }}
                  </p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-6 text-xs font-light px-2"
                    @click.stop="rejectChange(layer.id)"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-6 text-xs font-light px-2"
                    @click.stop="acceptChange(layer.id)"
                  >
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state when no changes -->
      <div v-else-if="changesOpen && layers.length === 0" class="px-3 pb-2">
        <p class="text-xs text-muted-foreground text-center py-2">
          No pending changes
        </p>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="border-t relative">
      <Textarea
        v-model="chatMessage"
        placeholder="Describe changes..."
        class="min-h-[120px] max-h-[120px] w-full rounded-none border-0 focus-visible:ring-0 resize-none break-all pb-12 text-sm font-light"
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
            class="h-7 w-7 p-0"
            :title="tool.name"
            @click="selectTool(tool.id)"
          >
            <component :is="tool.icon" :size="14" />
          </Button>
        </div>
        <div class="flex items-center gap-1">
          <Button as-child variant="outline" size="sm" class="h-7 w-7 p-0">
            <NuxtLink to="/studio/chat" title="Open full chat">
              <Maximize2 :size="14" />
            </NuxtLink>
          </Button>
          <Button
            size="sm"
            class="h-7 w-7 p-0"
            :disabled="!chatMessage.trim()"
            @click="sendMessage"
          >
            <Send :size="14" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
