<script setup lang="ts">
import { Plus, X, Sparkles, Trash2, MessageSquarePlus } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "#console/components/ui/dropdown-menu";
import ChatMessage from "#console/components/layout/chat/ChatMessage.vue";
import ChatInput from "#console/components/layout/chat/ChatInput.vue";

const { t } = useI18n();
const { wLink } = useWorkspaceLink();
const { close } = useChatPanel();

const {
	sessions,
	currentSession,
	currentSessionId,
	messages,
	isStreaming,
	needsProvider,
	error,
	selectSession,
	newSession,
	deleteSession,
	sendMessage,
} = useChat();

const draft = ref("");
const listEl = ref<HTMLElement | null>(null);

// A send/stream failure maps to actionable copy; anything else is unexpected.
const errorMessage = computed(() =>
	error.value ? t(`chat.error.${error.value}`) : null,
);

// Keep the newest message in view as the conversation grows and as the reply
// streams in — but only when the user is already near the bottom, so scrolling
// up to read earlier text mid-stream isn't yanked back down.
function nearBottom(): boolean {
	const el = listEl.value;
	if (!el) return true;
	return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
}
function scrollToBottom() {
	nextTick(() => {
		const el = listEl.value;
		if (el) el.scrollTop = el.scrollHeight;
	});
}
// A new message (the user's own send, or a fresh assistant turn) always scrolls;
// streaming tokens only when the user hasn't scrolled away.
watch(() => messages.value.length, scrollToBottom);
watch(
	() => messages.value.at(-1)?.content,
	() => {
		if (isStreaming.value && nearBottom()) scrollToBottom();
	},
);
onMounted(scrollToBottom);

async function handleSend() {
	const text = draft.value;
	draft.value = "";
	await sendMessage(text);
	// A failure before the message was accepted (e.g. session create failed)
	// leaves the text unsent — restore it so the user doesn't lose what they typed.
	if (error.value === "send") draft.value = text;
}

function handleRetry() {
	if (isStreaming.value) return;
	const lastUser = [...messages.value].reverse().find((m) => m.role === "user");
	if (lastUser) sendMessage(lastUser.content);
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <!-- Header: session switcher, new chat, close. -->
    <div
      class="flex h-11 shrink-0 items-center gap-1.5 border-b border-border/50 px-3"
    >
      <Sparkles :size="16" class="shrink-0 text-muted-foreground" />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {{ currentSession?.title ?? t("chat.newChat") }}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="w-64">
          <DropdownMenuItem @select="newSession">
            <MessageSquarePlus :size="15" class="mr-2" />
            {{ t("chat.newChat") }}
          </DropdownMenuItem>
          <template v-if="sessions.length">
            <DropdownMenuSeparator />
            <div
              v-for="s in sessions"
              :key="s.id"
              class="group/session flex items-center"
            >
              <DropdownMenuItem
                class="min-w-0 flex-1"
                :class="s.id === currentSessionId && 'bg-muted'"
                @select="selectSession(s.id)"
              >
                <span class="truncate">{{ s.title }}</span>
              </DropdownMenuItem>
              <button
                type="button"
                class="mr-1 rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover/session:opacity-100"
                :aria-label="t('chat.deleteSession')"
                @click.stop="deleteSession(s.id)"
              >
                <Trash2 :size="13" />
              </button>
            </div>
          </template>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        :aria-label="t('chat.newChat')"
        @click="newSession"
      >
        <Plus :size="16" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-7 shrink-0 text-muted-foreground hover:text-foreground"
        :aria-label="t('chat.close')"
        @click="close"
      >
        <X :size="16" />
      </Button>
    </div>

    <!-- No inference provider: prompt to connect one instead of erroring. -->
    <div
      v-if="needsProvider"
      class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div
        class="flex size-10 items-center justify-center rounded-lg bg-muted/50"
      >
        <Sparkles :size="20" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">
        {{ t("chat.needsProviderTitle") }}
      </p>
      <p class="max-w-xs text-xs text-muted-foreground">
        {{ t("chat.needsProviderDescription") }}
      </p>
      <Button as-child size="sm" variant="outline">
        <NuxtLink :to="wLink('/integrations/providers')">
          {{ t("chat.needsProviderCta") }}
        </NuxtLink>
      </Button>
    </div>

    <!-- Empty conversation. -->
    <div
      v-else-if="messages.length === 0"
      class="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <div
        class="flex size-10 items-center justify-center rounded-lg bg-muted/50"
      >
        <Sparkles :size="20" class="text-muted-foreground" />
      </div>
      <p class="text-sm font-medium text-foreground">
        {{ t("chat.emptyTitle") }}
      </p>
      <p class="max-w-xs text-xs text-muted-foreground">
        {{ t("chat.emptyDescription") }}
      </p>
    </div>

    <!-- Conversation. -->
    <div v-else ref="listEl" class="flex-1 space-y-4 overflow-y-auto px-3 py-4">
      <ChatMessage
        v-for="m in messages"
        :key="m.id"
        :message="m"
        @try-again="handleRetry"
      />
    </div>

    <!-- Input, hidden while the no-provider CTA is showing. -->
    <div v-if="!needsProvider" class="shrink-0 border-t border-border/50 p-3">
      <p
        v-if="errorMessage"
        class="mb-2 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
      >
        {{ errorMessage }}
      </p>
      <ChatInput v-model="draft" :disabled="isStreaming" @send="handleSend" />
    </div>
  </div>
</template>
