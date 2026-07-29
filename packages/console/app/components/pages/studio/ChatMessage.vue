<script setup lang="ts">
import {
	Copy,
	Check,
	ThumbsUp,
	ThumbsDown,
	RefreshCw,
	Pencil,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
	goodFeedback?: boolean;
	badFeedback?: boolean;
}

const props = defineProps<{
	message: Message;
	isEditing?: boolean;
}>();

const emit = defineEmits<{
	copy: [id: string];
	edit: [id: string];
	good: [id: string];
	bad: [id: string];
	tryAgain: [id: string];
}>();

const copied = ref(false);

async function handleCopy() {
	await navigator.clipboard.writeText(props.message.content);
	copied.value = true;
	emit("copy", props.message.id);
	setTimeout(() => {
		copied.value = false;
	}, 2000);
}
</script>

<template>
  <div
    :class="[
      'flex flex-col group',
      message.role === 'user' ? 'items-end' : 'items-start',
    ]"
  >
    <div
      class="rounded-lg px-4 py-2 max-w-[80%] bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white break-words"
    >
      <p class="text-sm break-words">
        {{ message.content }}
      </p>
    </div>
    <!-- Action buttons and timestamp positioned under message bubble -->
    <div
      :class="[
        'flex items-center mt-1 gap-2 w-auto',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
      ]"
    >
      <!-- Action buttons -->
      <div class="flex gap-1">
        <!-- User message buttons: copy and edit -->
        <template v-if="message.role === 'user'">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            @click="handleCopy"
          >
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="[
              'h-7 w-7 p-0 transition-colors',
              isEditing
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
            ]"
            @click="emit('edit', message.id)"
          >
            <Pencil :size="14" />
          </Button>
        </template>

        <!-- Assistant message buttons: copy, good, bad, try again -->
        <template v-else>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            @click="handleCopy"
          >
            <Check v-if="copied" :size="14" />
            <Copy v-else :size="14" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="[
              'h-7 w-7 p-0 transition-colors',
              message.goodFeedback
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
            ]"
            @click="emit('good', message.id)"
          >
            <ThumbsUp :size="14" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="[
              'h-7 w-7 p-0 transition-colors',
              message.badFeedback
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100',
            ]"
            @click="emit('bad', message.id)"
          >
            <ThumbsDown :size="14" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            @click="emit('tryAgain', message.id)"
          >
            <RefreshCw :size="14" />
          </Button>
        </template>
      </div>

      <!-- Timestamp -->
      <p
        class="text-xs text-neutral-500 dark:text-neutral-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        {{ message.timestamp.toLocaleTimeString() }}
      </p>
    </div>
  </div>
</template>
