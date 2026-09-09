<script setup lang="ts">
import { ExternalLink } from "@lucide/vue";
import { Button } from "#console/components/ui/button";

const { t } = useI18n();

useHead({ title: () => t("auth.desktop.title") });

definePageMeta({
	layout: "auth",
});

// The deep-link URL (with token) minted on the login/return page, handed over in
// memory (never in the browser URL). Absent if this page was reached directly or
// reloaded — then there's nothing to hand off, so we show the fallback.
const handoff = takeDesktopHandoff();

// Fire the deep link once on mount: a top-level custom-scheme navigation hands
// the URL to the OS, which routes it to the desktop app. The browser tab is left
// here showing the confirmation. A manual button re-fires it if the OS prompt
// was dismissed.
function openApp() {
	if (handoff) window.location.href = handoff;
}

onMounted(openApp);
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ t("auth.desktop.heading") }}
      </h1>
      <p class="text-sm text-muted-foreground">
        {{ handoff ? t("auth.desktop.subtitle") : t("auth.desktop.expired") }}
      </p>
    </div>

    <div v-if="handoff" class="space-y-3">
      <Button class="h-10 w-full" @click="openApp">
        <ExternalLink :size="16" class="mr-2" />
        {{ t("auth.desktop.openApp") }}
      </Button>
      <p class="text-center text-xs text-muted-foreground">
        {{ t("auth.desktop.closeHint") }}
      </p>
    </div>

    <div v-else class="space-y-3">
      <Button as-child variant="outline" class="h-10 w-full">
        <NuxtLink to="/auth/login">{{ t("auth.desktop.backToLogin") }}</NuxtLink>
      </Button>
    </div>
  </div>
</template>
