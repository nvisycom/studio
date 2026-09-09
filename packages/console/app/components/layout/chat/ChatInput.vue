<script setup lang="ts">
import { ArrowUp } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { Textarea } from "#console/components/ui/textarea";

const value = defineModel<string>({ required: true });

defineProps<{
	disabled?: boolean;
}>();

const emit = defineEmits<{
	send: [];
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
    class="relative rounded-lg border border-border bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
  >
    <Textarea
      v-model="value"
      :placeholder="t('chat.placeholder')"
      class="max-h-40 min-h-[64px] resize-none border-0 pr-12 shadow-none focus-visible:ring-0"
      @keydown.enter.exact="onEnter"
    />
    <Button
      size="icon-sm"
      class="absolute bottom-2 right-2 size-8 rounded-md"
      :disabled="!value.trim() || disabled"
      :aria-label="t('chat.send')"
      @click="handleSend"
    >
      <ArrowUp :size="16" />
    </Button>
  </div>
</template>
