<template>
  <div class="h-screen flex flex-col overflow-hidden relative">
    <!-- Background (Gradient or Solid) -->
    <div
      class="absolute inset-0"
      :class="settings.useGradient
        ? 'bg-gradient-to-br from-pink-200/70 via-blue-200/50 to-purple-200/70 dark:from-pink-900/40 dark:via-blue-900/30 dark:to-purple-900/40'
        : 'bg-neutral-100 dark:bg-neutral-900'"
    />

    <!-- Drag & Drop Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isDragging && isAuthenticated"
        class="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[2px]"
      >
        <div class="flex flex-col items-center gap-2">
          <Upload class="w-10 h-10 text-primary/60" />
          <p class="text-sm font-medium text-primary/80">{{ $t('files.dropzone.title') }}</p>
        </div>
      </div>
    </Transition>

    <!-- Content Layer -->
    <div class="relative h-full flex flex-col">
      <!-- Fixed Header -->
      <AppHeader class="flex-shrink-0" />

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col overflow-hidden px-3 pb-2 pt-1">
        <div class="flex-1 overflow-auto bg-white dark:bg-neutral-950 rounded-xl border border-white/50 dark:border-neutral-800/50 shadow-sm">
          <slot />
        </div>
      </main>

      <!-- Fixed Footer -->
      <AppFooter class="flex-shrink-0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import "~/assets/tailwind.css";
import { Upload } from "lucide-vue-next";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSettings } from "~/composables/useSettings";
import { useDragDrop } from "~/composables/useDragDrop";
import { useActiveTab } from "~/composables/useActiveTab";
import { useAuth } from "~/composables/useAuth";

const { settings } = useSettings();
const { isDragging, setupListeners, cleanupListeners } = useDragDrop();
const activeTab = useActiveTab();
const { isAuthenticated } = useAuth();

// Setup Tauri drag-drop listeners and window hide check
onMounted(async () => {
  // Setup drag-drop listeners
  await setupListeners();

  // Listen for check-hide-window event from Tauri
  // Only hide if not currently dragging files
  await listen("check-hide-window", async () => {
    if (!isDragging.value) {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    }
  });
});

onUnmounted(() => {
  cleanupListeners();
});

// Auto-switch to files tab when dragging starts
watch(isDragging, (dragging) => {
  if (dragging && isAuthenticated.value) {
    activeTab.value = 'files';
  }
});

definePageMeta({
  layout: false,
});
</script>
