<script setup lang="ts">
import {
	Send,
	Pencil,
	Paperclip,
	Upload,
	Sparkles,
	FileText,
} from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Textarea } from "#console/components/ui/textarea";

const value = defineModel<string>({ required: true });

defineProps<{
	isEditing?: boolean;
}>();

const emit = defineEmits<{
	send: [];
	attach: [];
	upload: [];
	generate: [];
	summarize: [];
}>();

function handleSend() {
	if (!value.value.trim()) return;
	emit("send");
	value.value = "";
}
</script>

<template>
  <div
    class="border border-neutral-200 dark:border-neutral-800 rounded-lg relative"
  >
    <Textarea
      v-model="value"
      placeholder="Type your message here."
      class="min-h-[120px] border-0 focus-visible:ring-0 resize-none pl-3 pr-12 pb-12"
      @keydown.enter.prevent="handleSend"
    />
    <!-- Buttons inside textarea -->
    <div
      class="absolute bottom-3 left-3 right-3 flex justify-between items-center"
    >
      <!-- Left side buttons with text and borders -->
      <div class="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('attach')"
        >
          <Paperclip :size="14" class="mr-1.5" />
          <span class="text-xs">Attach</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('upload')"
        >
          <Upload :size="14" class="mr-1.5" />
          <span class="text-xs">Upload</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('generate')"
        >
          <Sparkles :size="14" class="mr-1.5" />
          <span class="text-xs">Generate</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('summarize')"
        >
          <FileText :size="14" class="mr-1.5" />
          <span class="text-xs">Summarize</span>
        </Button>
      </div>

      <!-- Right side send/edit button -->
      <Button
        @click="handleSend"
        :disabled="!value.trim()"
        size="sm"
        :class="['h-8 w-8 p-0', isEditing && 'bg-blue-600 hover:bg-blue-700']"
      >
        <Pencil v-if="isEditing" :size="16" />
        <Send v-else :size="16" />
      </Button>
    </div>
  </div>
</template>
