<script setup lang="ts">
import { X, MessagesSquare } from "@lucide/vue";
import { Button } from "#console/components/ui/button";

// Live support chat isn't wired to a backend yet. Rather than simulate a
// conversation (which makes users believe support received a message that was
// never sent), show an honest "coming soon" panel. Swap this for the real chat
// once a support service exists.
const { isOpen, toggle: toggleChat } = useHelpChat();
const { t } = useI18n();
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed bottom-6 right-6 z-50 flex h-[420px] w-[380px] flex-col rounded-lg border border-border bg-background shadow-2xl"
  >
    <div
      class="flex items-center justify-between rounded-t-lg border-b border-border px-4 py-3"
    >
      <span class="font-medium">{{ t("helpChat.title") }}</span>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0"
        :aria-label="t('common.close')"
        @click="toggleChat"
      >
        <X :size="18" />
      </Button>
    </div>

    <div
      class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <MessagesSquare :size="28" class="text-muted-foreground/60" />
      <p class="text-sm font-medium text-foreground">
        {{ t("helpChat.comingSoon") }}
      </p>
      <p class="text-sm text-muted-foreground">
        {{ t("helpChat.contact") }}
        <a
          href="mailto:support@nvisy.com"
          class="text-foreground underline underline-offset-2"
          >support@nvisy.com</a
        >.
      </p>
    </div>
  </div>
</template>
