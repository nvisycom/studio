<script setup lang="ts">
import { ref } from "vue";
import { MessageSquare, Send } from "lucide-vue-next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

definePageMeta({
  pageName: "Knowledge",
});

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const messageInput = ref("");
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

  messageInput.value = "";
}
</script>

<template>
  <div class="flex flex-1 flex-col p-4 pt-4 pb-6">
    <div class="max-w-4xl mx-auto w-full flex flex-col flex-1">
      <Card
        class="overflow-hidden py-0 pt-6 rounded-xl border-neutral-200 dark:border-neutral-800 flex flex-col flex-1"
      >
        <CardHeader>
          <div>
            <CardTitle>Knowledge Chat</CardTitle>
            <CardDescription>
              Ask questions and get intelligent answers from your knowledge base
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent class="flex flex-col flex-1 pb-6">
          <!-- Chat Messages -->
          <div class="space-y-4 mb-4 flex-1 overflow-y-auto">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="[
                'flex',
                message.role === 'user' ? 'justify-end' : 'justify-start',
              ]"
            >
              <div
                :class="[
                  'rounded-lg px-4 py-2 max-w-[80%]',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white',
                ]"
              >
                <p class="text-sm">{{ message.content }}</p>
                <p
                  :class="[
                    'text-xs mt-1',
                    message.role === 'user'
                      ? 'text-blue-100'
                      : 'text-neutral-500 dark:text-neutral-400',
                  ]"
                >
                  {{ message.timestamp.toLocaleTimeString() }}
                </p>
              </div>
            </div>
          </div>

          <!-- Message Input -->
          <div class="flex gap-2">
            <Textarea
              v-model="messageInput"
              placeholder="Ask a question about your knowledge base..."
              class="flex-1 min-h-[80px]"
              @keydown.enter.prevent="sendMessage"
            />
            <Button @click="sendMessage" :disabled="!messageInput.trim()">
              <Send :size="16" class="mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
