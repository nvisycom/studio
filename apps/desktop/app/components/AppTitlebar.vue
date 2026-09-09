<script setup lang="ts">
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { Button } from "#console/components/ui/button";

// The desktop main window uses the macOS "Overlay" title-bar style: the webview
// runs full-height behind the traffic-light buttons. This strip reserves that
// space at the very top of the window (see the `.tauri` title-bar rules in the
// theme CSS) and is the window's drag region. It holds the back/forward nav.
//
// Only the "main" window gets it — the spotlight launcher is a separate window
// that renders the same app.vue, and its own chrome must stay untouched.
//
// Dragging and double-click-to-zoom are both handled natively by the OS via
// `-webkit-app-region: drag` (set on `[data-tauri-drag-region]` in titlebar.css):
// on macOS that makes the strip a real title bar. We intentionally add NO JS
// gesture handling — a JS `toggleMaximize()` on double-click ran a second zoom
// on top of the native one and sprang the window straight back. The nav buttons
// opt back out with `-webkit-app-region: no-drag` (the `.titlebar-control` class)
// so they stay clickable islands within the drag strip.
const isMainWindow = isTauri() && getCurrentWindow().label === "main";

const { t } = useI18n();
const { canBack, canForward, back, forward, install } = useNavHistory();

// Start tracking history once the title bar mounts (only in the main window).
onMounted(() => {
	if (isMainWindow) install();
});
</script>

<template>
  <div
    v-if="isMainWindow"
    data-tauri-drag-region
    class="fixed inset-x-0 top-0 z-50 flex h-(--titlebar-height) items-center bg-sidebar"
  >
    <!-- Nav controls, offset past the macOS traffic lights. `no-drag` (via
         `.titlebar-control`) keeps them clickable inside the drag strip. -->
    <div class="titlebar-control flex items-center gap-0.5 pl-[5.25rem]">
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-7 text-muted-foreground hover:text-foreground"
        :disabled="!canBack"
        :aria-label="t('titlebar.back')"
        @click="back"
      >
        <ChevronLeft :size="18" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        class="size-7 text-muted-foreground hover:text-foreground"
        :disabled="!canForward"
        :aria-label="t('titlebar.forward')"
        @click="forward"
      >
        <ChevronRight :size="18" />
      </Button>
    </div>
  </div>
</template>
