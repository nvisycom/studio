<script setup lang="ts">
import { ref } from "vue";
import { X, Send } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const isOpen = ref(false);
const messageInput = ref("");
const messages = ref<Message[]>([
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm here to help. What can I assist you with today?",
    timestamp: new Date(),
  },
]);

function toggleChat() {
  isOpen.value = !isOpen.value;
}

function sendMessage() {
  if (!messageInput.value.trim()) return;

  messages.value.push({
    id: Date.now().toString(),
    role: "user",
    content: messageInput.value,
    timestamp: new Date(),
  });

  // Simulate assistant response
  setTimeout(() => {
    messages.value.push({
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        "I'm processing your question. In a real implementation, this would connect to a help system or support API.",
      timestamp: new Date(),
    });
  }, 500);

  messageInput.value = "";
}

defineExpose({
  toggleChat,
});
</script>

<template>
  <!-- Chat Popup -->
  <div
    v-if="isOpen"
    class="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-2xl flex flex-col z-50"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 rounded-t-lg"
    >
      <span class="font-medium">Support Chat</span>
      <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="toggleChat">
        <X :size="18" />
      </Button>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div
        v-for="message in messages"
        :key="message.id"
        :class="[
          'flex flex-col',
          message.role === 'user' ? 'items-end' : 'items-start',
        ]"
      >
        <div
          class="rounded-lg px-4 py-2 max-w-[85%] bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white break-words"
        >
          <p class="text-sm break-words overflow-wrap-anywhere">
            {{ message.content }}
          </p>
        </div>
        <p
          class="text-sm font-light mt-1 text-neutral-500 dark:text-neutral-400"
        >
          {{ message.timestamp.toLocaleTimeString() }}
        </p>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-neutral-200 dark:border-neutral-800">
      <div class="flex gap-2">
        <Textarea
          v-model="messageInput"
          placeholder="Type your message..."
          class="flex-1 min-h-[60px] max-h-[120px] resize-none"
          @keydown.enter.prevent="sendMessage"
        />
        <Button
          @click="sendMessage"
          :disabled="!messageInput.trim()"
          size="sm"
          class="h-[60px] w-[60px] p-0"
        >
          <Send :size="18" />
        </Button>
      </div>
    </div>
  </div>
</template>
