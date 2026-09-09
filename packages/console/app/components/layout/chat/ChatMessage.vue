<script setup lang="ts">
import { Copy, Check, RefreshCw } from "@lucide/vue";
import { Button } from "#console/components/ui/button";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: string;
	streaming?: boolean;
}

const props = defineProps<{
	message: Message;
}>();

const emit = defineEmits<{
	tryAgain: [id: string];
}>();

const { t, locale } = useI18n();

const copied = ref(false);

const timestamp = computed(() =>
	new Date(props.message.createdAt).toLocaleTimeString(locale.value, {
		hour: "2-digit",
		minute: "2-digit",
	}),
);

async function handleCopy() {
	try {
		await navigator.clipboard.writeText(props.message.content);
	} catch {
		// Clipboard unavailable (permissions, insecure context) — do nothing rather
		// than leaving an unhandled rejection or a false "copied" state.
		return;
	}
	copied.value = true;
	setTimeout(() => {
		copied.value = false;
	}, 2000);
}
</script>

<template>
  <div
    :class="[
      'group flex flex-col gap-1',
      message.role === 'user' ? 'items-end' : 'items-start',
    ]"
  >
    <div
      :class="[
        'max-w-[85%] break-words rounded-lg px-3 py-2 text-sm',
        message.role === 'user'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground',
      ]"
    >
      <p class="whitespace-pre-wrap break-words">{{ message.content }}</p>
      <!-- A blinking caret while the assistant reply is still streaming in. -->
      <span
        v-if="message.streaming"
        class="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-xs bg-current"
      />
    </div>

    <!-- Actions + timestamp, revealed on hover. Assistant replies can be copied,
         rated, and retried; the user's own messages just show a copy control. -->
    <div
      v-if="!message.streaming"
      :class="[
        'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row',
      ]"
    >
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-6 text-muted-foreground hover:text-foreground"
        :aria-label="copied ? t('chat.copied') : t('chat.copy')"
        @click="handleCopy"
      >
        <Check v-if="copied" :size="13" />
        <Copy v-else :size="13" />
      </Button>
      <Button
        v-if="message.role === 'assistant'"
        variant="ghost"
        size="icon-sm"
        class="size-6 text-muted-foreground hover:text-foreground"
        :aria-label="t('chat.retry')"
        @click="emit('tryAgain', message.id)"
      >
        <RefreshCw :size="13" />
      </Button>
      <span class="text-xs tabular-nums text-muted-foreground">
        {{ timestamp }}
      </span>
    </div>
  </div>
</template>
