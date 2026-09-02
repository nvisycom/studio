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

const { t } = useI18n();

function handleSend() {
	if (!value.value.trim()) return;
	emit("send");
	value.value = "";
}

// Enter submits, but not mid-IME composition — pressing Enter to pick a CJK
// candidate must not send (and clear) the draft. Guard before preventing the
// default so the composition keystroke still reaches the textarea.
function onEnter(event: KeyboardEvent) {
	if (event.isComposing) return;
	event.preventDefault();
	handleSend();
}
</script>

<template>
  <div
    class="border border-neutral-200 dark:border-neutral-800 rounded-lg relative"
  >
    <Textarea
      v-model="value"
      :placeholder="t('studio.chat.inputPlaceholder')"
      class="min-h-[120px] border-0 focus-visible:ring-0 resize-none pl-3 pr-12 pb-12"
      @keydown.enter.exact="onEnter"
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
          <span class="text-xs">{{ t("studio.chat.attach") }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('upload')"
        >
          <Upload :size="14" class="mr-1.5" />
          <span class="text-xs">{{ t("studio.chat.upload") }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('generate')"
        >
          <Sparkles :size="14" class="mr-1.5" />
          <span class="text-xs">{{ t("studio.chat.generate") }}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          class="h-7 px-2"
          @click="emit('summarize')"
        >
          <FileText :size="14" class="mr-1.5" />
          <span class="text-xs">{{ t("studio.chat.summarize") }}</span>
        </Button>
      </div>

      <!-- Right side send/edit button -->
      <Button
        @click="handleSend"
        :disabled="!value.trim()"
        size="sm"
        :aria-label="isEditing ? t('studio.chat.saveEdit') : t('studio.chat.send')"
        :class="['h-8 w-8 p-0', isEditing && 'bg-blue-600 hover:bg-blue-700']"
      >
        <Pencil v-if="isEditing" :size="16" />
        <Send v-else :size="16" />
      </Button>
    </div>
  </div>
</template>
