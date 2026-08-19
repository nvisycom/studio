<script setup lang="ts">
import { invoke, isTauri } from "@tauri-apps/api/core";
import { ArrowUp, ChevronDown, File as FileIcon, Sparkles } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import { useSpotlightIntent } from "~/composables/useSpotlightIntent";

const { t } = useI18n();

// The spotlight window is a bare overlay — no dashboard chrome, no workspace.
definePageMeta({
	layout: false,
});
// The shared theme paints html/body `bg-background` (opaque). This window is
// transparent, so tag the document and clear that background (see the global
// style below) — otherwise the "empty" area shows white instead of the desktop.
useHead({
	title: () => t("spotlight.placeholder"),
	htmlAttrs: { class: "spotlight-window" },
});

const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const { intent } = useSpotlightIntent(query);

// Assistant/file backend isn't wired yet. Submitting surfaces an honest
// "coming soon" panel rather than a fake success; the real send drops in where
// `submitted` is set (swap for the assistant call, keyed off `intent`).
const submitted = ref(false);

// Dismiss the launcher (Esc / after handing off). Hides the native window in the
// Tauri shell; in a plain browser (dev) there's nothing to hide.
function dismiss(): void {
	if (isTauri()) invoke("hide_spotlight").catch(() => {});
}

function submit(): void {
	if (intent.value === "empty") return;
	// TODO: route to the assistant chat / file flow once the backend lands.
	// Until then, show the coming-soon panel.
	submitted.value = true;
}

// Reset back to the resting input whenever the window is re-summoned. The window
// is hidden, not destroyed, so a fresh reveal fires `focus`; clear stale state
// and refocus the field there.
function resetForReveal(): void {
	submitted.value = false;
	query.value = "";
	nextTick(() => inputRef.value?.focus());
}

onMounted(() => {
	inputRef.value?.focus();
	window.addEventListener("focus", resetForReveal);
});
onBeforeUnmount(() => {
	window.removeEventListener("focus", resetForReveal);
});

function openApp(): void {
	// Reveal the main window, then get out of the way.
	if (isTauri()) invoke("toggle_spotlight").catch(() => {});
}
</script>

<template>
  <!-- The window is transparent + borderless, so this card IS the window: it
       fills the bounds edge-to-edge so the native macOS window shadow hugs the
       rounded card shape instead of the (larger) window rectangle. Esc
       dismisses. -->
  <div
    class="flex min-h-screen w-screen items-stretch bg-transparent"
    @keydown.esc="dismiss"
  >
    <div
      class="flex w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl"
    >
      <!-- Input row -->
      <div class="flex items-center gap-3 px-4 py-3.5">
        <Sparkles :size="20" class="shrink-0 text-primary" />
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          :placeholder="t('spotlight.placeholder')"
          class="min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/70"
          @keydown.enter="submit"
        />

        <!-- Context chip: the target of this entry. Reads as a chat by default;
             flips to a file affordance when the text looks like one. -->
        <div
          class="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground"
        >
          <FileIcon v-if="intent === 'file'" :size="14" />
          <span>{{
            intent === "file"
              ? t("spotlight.context.file")
              : t("spotlight.context.chat")
          }}</span>
          <ChevronDown :size="14" class="text-muted-foreground/60" />
        </div>

        <Button
          size="icon-sm"
          class="shrink-0 rounded-lg"
          :disabled="intent === 'empty'"
          :aria-label="t('spotlight.submit')"
          @click="submit"
        >
          <ArrowUp :size="16" />
        </Button>
      </div>

      <!-- Secondary row: reflects the detected intent, or the coming-soon state
           once submitted. Kept in the flow (not absolute) so the window's fixed
           height always frames it. -->
      <div class="border-t border-border/50 px-4 py-2.5">
        <div
          v-if="submitted"
          class="flex items-center justify-between gap-3"
        >
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-foreground">
              {{ t("spotlight.comingSoon.title") }}
            </p>
            <p class="truncate text-xs text-muted-foreground">
              {{ t("spotlight.comingSoon.description") }}
            </p>
          </div>
          <Button size="sm" variant="outline" class="shrink-0" @click="openApp">
            {{ t("spotlight.openApp") }}
          </Button>
        </div>

        <div v-else class="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            class="inline-flex items-center gap-1 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-medium"
          >
            <FileIcon v-if="intent === 'file'" :size="11" />
            <Sparkles v-else :size="11" />
            {{
              intent === "file"
                ? t("spotlight.intent.file")
                : t("spotlight.intent.message")
            }}
          </span>
          <span class="truncate">
            {{
              intent === "file"
                ? t("spotlight.hint.file")
                : t("spotlight.hint.message")
            }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Global (unscoped): the shared theme paints html/body an opaque
     `bg-background`. For the transparent spotlight window we clear it so the
     desktop shows through around the card. Scoped to `.spotlight-window` (set on
     <html> above) so it only affects this window, never the main app. -->
<style>
html.spotlight-window,
html.spotlight-window body {
	background: transparent !important;
}
</style>
