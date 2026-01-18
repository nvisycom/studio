<template>
  <div class="flex flex-col h-full border-l border-border/30 bg-background">
    <!-- Tool content: AI Chat -->
    <div v-if="activeToolId === 'chat'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Chat messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        <div
          v-for="message in messages"
          :key="message.id"
          class="group flex flex-col"
          :class="viewMode === 'chat'
            ? (message.role === 'user' ? 'items-end' : 'items-start')
            : 'items-stretch'"
          @mouseenter="hoveredMessageId = message.id"
          @mouseleave="hoveredMessageId = null"
        >
          <!-- Message content -->
          <div
            class="px-3 py-2 rounded-lg text-sm"
            :class="[
              viewMode === 'chat' ? 'max-w-[90%]' : 'w-full',
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted'
            ]"
          >
            {{ message.content }}
          </div>

          <!-- Action buttons row with timestamp -->
          <div
            class="flex items-center gap-1 mt-1"
            :class="viewMode === 'chat'
              ? (message.role === 'user' ? 'flex-row' : 'flex-row-reverse')
              : 'flex-row-reverse'"
          >
            <!-- Timestamp -->
            <Transition name="fade">
              <span
                v-if="hoveredMessageId === message.id"
                class="text-[10px] text-muted-foreground/60 px-1"
              >
                {{ formatTime(message.timestamp) }}
              </span>
            </Transition>

            <!-- Action buttons -->
            <div class="flex items-center gap-0.5">
              <template v-if="message.role === 'user'">
                <button @click="copyMessage(message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <Check v-if="copiedMessageId === message.id" class="w-3 h-3 text-muted-foreground" />
                  <Copy v-else class="w-3 h-3 text-muted-foreground" />
                </button>
                <button @click="$emit('edit-message', message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <Pencil class="w-3 h-3 text-muted-foreground" />
                </button>
              </template>
              <template v-else>
                <button @click="copyMessage(message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <Check v-if="copiedMessageId === message.id" class="w-3 h-3 text-muted-foreground" />
                  <Copy v-else class="w-3 h-3 text-muted-foreground" />
                </button>
                <button @click="likeMessage(message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <ThumbsUp class="w-3 h-3" :class="message.liked ? 'text-foreground fill-foreground' : 'text-muted-foreground'" />
                </button>
                <button @click="dislikeMessage(message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <ThumbsDown class="w-3 h-3" :class="message.disliked ? 'text-foreground fill-foreground' : 'text-muted-foreground'" />
                </button>
                <button @click="$emit('regenerate-message', message)" class="p-1 rounded hover:bg-muted transition-colors">
                  <RotateCcw class="w-3 h-3 text-muted-foreground" />
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="isTyping" class="flex" :class="viewMode === 'chat' ? 'justify-start' : ''">
          <div class="bg-muted px-3 py-2 rounded-lg" :class="viewMode === 'edit' ? 'w-full' : ''">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay: 150ms" />
              <span class="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style="animation-delay: 300ms" />
            </div>
          </div>
        </div>
      </div>

      <!-- Chat input -->
      <div class="p-3 border-t border-border/50">
        <div class="relative bg-muted/30 border border-border/50 rounded-lg focus-within:ring-1 focus-within:ring-ring">
          <textarea
            ref="inputRef"
            v-model="inputMessage"
            :placeholder="$t('chat.placeholder')"
            rows="2"
            class="w-full px-3 py-2 text-sm bg-transparent resize-none focus:outline-none min-h-[60px]"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.meta.enter.prevent="sendMessage"
            @input="autoResize"
          />

          <!-- Context actions + send -->
          <div class="flex items-center justify-between px-2 pb-2">
            <div class="flex items-center gap-1">
              <button
                @click="applyContextAction('summarize')"
                class="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded transition-colors"
              >
                {{ $t('chat.context.summarize') }}
              </button>
              <button
                @click="applyContextAction('redact')"
                class="px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground border border-border/50 hover:border-border rounded transition-colors"
              >
                {{ $t('chat.context.redact') }}
              </button>
            </div>
            <button
              @click="sendMessage"
              :disabled="!inputMessage.trim()"
              class="p-1 rounded bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools tabs (at bottom) -->
    <div class="flex items-center gap-1 px-2 py-2 border-t border-border/30">
      <button
        v-for="tool in tools"
        :key="tool.id"
        @click="activeToolId = tool.id"
        class="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors"
        :class="activeToolId === tool.id
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
      >
        <component :is="tool.icon" class="w-3 h-3" />
        <span>{{ tool.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Sparkles } from "lucide-vue-next";

interface Message {
	id: number;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	liked?: boolean;
	disliked?: boolean;
}

const props = defineProps<{
	messages: Message[];
	isTyping: boolean;
	viewMode: "chat" | "edit";
}>();

const emit = defineEmits<{
	"send-message": [content: string];
	"edit-message": [message: Message];
	"regenerate-message": [message: Message];
}>();

// Refs
const inputRef = ref<HTMLTextAreaElement>();
const messagesContainer = ref<HTMLElement>();

// State
const inputMessage = ref("");
const hoveredMessageId = ref<number | null>(null);
const copiedMessageId = ref<number | null>(null);
const activeToolId = ref("chat");

// Tools panel
const tools = ref([{ id: "chat", name: "AI Chat", icon: Sparkles }]);

// Auto-focus input on mount
onMounted(() => {
	inputRef.value?.focus();
});

// Format timestamp
const formatTime = (date: Date) => {
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Auto-resize textarea
const autoResize = () => {
	if (inputRef.value) {
		inputRef.value.style.height = "auto";
		const newHeight = Math.min(Math.max(inputRef.value.scrollHeight, 60), 120);
		inputRef.value.style.height = `${newHeight}px`;
	}
};

// Copy message
const copyMessage = async (message: Message) => {
	try {
		await navigator.clipboard.writeText(message.content);
		copiedMessageId.value = message.id;
		setTimeout(() => {
			copiedMessageId.value = null;
		}, 2000);
	} catch (error) {
		console.error("Failed to copy:", error);
	}
};

// Like/dislike
const likeMessage = (message: Message) => {
	message.liked = !message.liked;
	if (message.liked) message.disliked = false;
};

const dislikeMessage = (message: Message) => {
	message.disliked = !message.disliked;
	if (message.disliked) message.liked = false;
};

// Context action
const applyContextAction = (action: string) => {
	const prompts: Record<string, string> = {
		summarize: "Summarize this document",
		redact: "Redact sensitive information",
	};
	inputMessage.value = prompts[action] || "";
	inputRef.value?.focus();
};

// Send message
const sendMessage = () => {
	const content = inputMessage.value.trim();
	if (!content) return;
	emit("send-message", content);
	inputMessage.value = "";
};

// Expose methods for parent to set input
const setInputMessage = (content: string) => {
	inputMessage.value = content;
	inputRef.value?.focus();
};

defineExpose({ setInputMessage });
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
