<script setup lang="ts">
import { Loader2 } from "@lucide/vue";
import { NvisyLogo } from "#console/components/brand";
import ErrorPage from "~/error.vue";
import AppTitlebar from "~/components/AppTitlebar.vue";

const { t } = useI18n();
const error = useError();

// While the shell restores the stored session token from the OS keychain at
// launch (an async read that can block on a system prompt), show a launch splash
// instead of the app. Otherwise the auth guard would see "no token yet", flash
// the login screen, then bounce back once the token lands. The splash holds only
// for that first read; once the token settles (to a value or null) the real
// screen — the shell or login — renders.
const { restoringDesktopAuth } = useDesktopAuth();
const { isAuthenticated } = useAuth();
const route = useRoute();

// The auth guard skips its redirect while the token is being restored (it can't
// yet tell "signed out" from "not read yet"). Once the read settles, re-run the
// decision for the route we held on: if it turns out we're signed out on a
// protected route, send the user to login now. Authed users simply stay put.
const authRoutePrefixes = ["/auth/", "/spotlight"];
watch(restoringDesktopAuth, (restoring) => {
	if (restoring) return;
	const onPublicRoute = authRoutePrefixes.some((p) => route.path.startsWith(p));
	if (!isAuthenticated.value && !onPublicRoute) {
		navigateTo({ path: "/auth/login" });
	}
});

// See apps/web/app/app.vue: a function titleTemplate (can't live in nuxt.config)
// so a missing or "Nvisy" title renders as plain "Nvisy", not "Nvisy · Nvisy".
useHead({
	titleTemplate: (title) =>
		!title || title === "Nvisy" ? "Nvisy" : `${title} · Nvisy`,
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <AppTitlebar />
    <ErrorPage v-if="error" :error="error" />
    <!-- Launch splash while the stored session is being restored (desktop).
         Mirrors the login screen's composition — same ground, titlebar-inset
         header band, centered brand mark — so the restore reads as the app
         loading, not a login prompt. The logo pairs with the status line the way
         login pairs it with its heading. -->
    <div
      v-else-if="restoringDesktopAuth"
      class="relative flex min-h-svh flex-col bg-background"
    >
      <header class="app-titlebar-inset px-6 py-4" />
      <main class="flex flex-1 items-center justify-center px-4">
        <div class="flex flex-col items-center space-y-3 text-center">
          <NvisyLogo :size="34" class="text-foreground" />
          <p
            class="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 :size="15" class="animate-spin" />
            {{ t("auth.restoring") }}
          </p>
        </div>
      </main>
    </div>
    <NuxtLayout v-else>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
