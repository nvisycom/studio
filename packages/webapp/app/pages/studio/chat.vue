<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { MessageInput, ChatMessage } from "@/components/pages/studio";

definePageMeta({
  pageCategory: "Studio",
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  goodFeedback?: boolean;
  badFeedback?: boolean;
}

const messageInput = ref("");
const isEditing = ref(false);
const editingMessageId = ref<string | null>(null);
const messages = ref<Message[]>([
  {
    id: "1",
    role: "assistant",
    content: "Hello! How can I help you with your knowledge base today?",
    timestamp: new Date(),
  },
]);

function sendMessage() {
  if (!messageInput.value.trim()) return;

  if (isEditing.value && editingMessageId.value) {
    // Update the existing message
    const messageIndex = messages.value.findIndex(
      (m) => m.id === editingMessageId.value,
    );
    if (messageIndex !== -1) {
      messages.value[messageIndex].content = messageInput.value;
      messages.value[messageIndex].timestamp = new Date();
    }
    isEditing.value = false;
    editingMessageId.value = null;
  } else {
    // Add new message
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
        content: "I'm processing your question about the knowledge base...",
        timestamp: new Date(),
      });
    }, 500);
  }

  messageInput.value = "";
}

function editMessage(id: string) {
  const message = messages.value.find((m) => m.id === id);
  if (message) {
    messageInput.value = message.content;
    isEditing.value = true;
    editingMessageId.value = id;
  }
}

function goodResponse(id: string) {
  const message = messages.value.find((m) => m.id === id);
  if (message) {
    message.goodFeedback = !message.goodFeedback;
    if (message.goodFeedback) {
      message.badFeedback = false;
    }
  }
}

function badResponse(id: string) {
  const message = messages.value.find((m) => m.id === id);
  if (message) {
    message.badFeedback = !message.badFeedback;
    if (message.badFeedback) {
      message.goodFeedback = false;
    }
  }
}

function tryAgain(_id: string) {
  // TODO: Implement retry
}

function attachFile() {
  // TODO: Implement attach file
}

function uploadDocument() {
  // TODO: Implement upload document
}

function generateResponse() {
  // TODO: Implement generate response
}

function summarize() {
  // TODO: Implement summarize
}
</script>

<template>
  <div class="relative flex flex-1 flex-col p-4 pt-4">
    <!-- Back to Studio button - positioned outside chat area -->
    <div class="absolute top-4 left-4">
      <Button as-child variant="outline" size="sm" class="font-light">
        <NuxtLink to="/studio" class="flex items-center gap-2">
          <ArrowLeft :size="14" />
          Studio
        </NuxtLink>
      </Button>
    </div>

    <div class="max-w-4xl mx-auto w-full flex flex-col flex-1">
      <div class="flex flex-col flex-1">
        <!-- Chat Messages -->
        <div class="space-y-4 mb-4 flex-1 overflow-y-auto">
          <ChatMessage
            v-for="message in messages"
            :key="message.id"
            :message="message"
            :is-editing="isEditing && editingMessageId === message.id"
            @edit="editMessage"
            @good="goodResponse"
            @bad="badResponse"
            @try-again="tryAgain"
          />
        </div>

        <!-- Message Input -->
        <MessageInput
          v-model="messageInput"
          :is-editing="isEditing"
          @send="sendMessage"
          @attach="attachFile"
          @upload="uploadDocument"
          @generate="generateResponse"
          @summarize="summarize"
        />
      </div>
    </div>
  </div>
</template>
