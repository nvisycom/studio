<script setup lang="ts">
import { Sheet, SheetContent } from "#console/components/ui/sheet";
import SheetHeader from "#console/components/ui/sheet/SheetHeader.vue";
import SheetTitle from "#console/components/ui/sheet/SheetTitle.vue";
import SheetDescription from "#console/components/ui/sheet/SheetDescription.vue";
import { useSidebar } from "#console/components/ui/sidebar";
import AppChatPanel from "#console/components/layout/chat/AppChatPanel.vue";

/**
 * The global workspace chat rail. On desktop it fills the shell's `[chat]` grid
 * track (see SidebarProvider), which reflows the content card when open; on
 * mobile it's an overlay sheet from the right so a narrow viewport isn't
 * squeezed. Both host the same `AppChatPanel`. Mounted once in the shell layout.
 */
const { t } = useI18n();
const { isOpen, close } = useChatPanel();
const { isMobile } = useSidebar();
const { loadSessions } = useChat();

// Load the workspace's chat sessions the first time the rail opens, so an unused
// chat never fetches on every page.
watch(
	isOpen,
	(open) => {
		if (open) loadSessions();
	},
	{ immediate: true },
);
</script>

<template>
  <Sheet
    v-if="isMobile"
    :open="isOpen"
    @update:open="(value: boolean) => !value && close()"
  >
    <SheetContent side="right" class="w-[min(22rem,90vw)] bg-sidebar p-0">
      <SheetHeader class="sr-only">
        <SheetTitle>{{ t("chat.title") }}</SheetTitle>
        <SheetDescription>{{ t("chat.description") }}</SheetDescription>
      </SheetHeader>
      <AppChatPanel />
    </SheetContent>
  </Sheet>

  <!-- `v-show` (not `v-if`) keeps the streamed conversation mounted across
       toggles; the track collapses to zero width when closed (see the grid). -->
  <aside
    v-else
    v-show="isOpen"
    class="chat-rail bg-sidebar flex h-full min-h-0 min-w-0 flex-col overflow-hidden"
  >
    <AppChatPanel />
  </aside>
</template>

<style scoped>
.chat-rail {
  grid-column: chat / -1;
}
</style>
