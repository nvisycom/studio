<script setup lang="ts">
import type { NuxtError } from "#app";
import { ArrowLeft, Home, RefreshCw, ServerOff } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";

const props = defineProps<{
	error: NuxtError;
}>();

const { t } = useI18n();

const { override, defaultUrl } = useApiBaseUrl();

// The transport-level "server unreachable" case, raised by the SDK plugin when a
// request's fetch rejects (no HTTP response) for a signed-in, self-hosted user.
// It's not an HTTP status page — it's "your server isn't answering", with the
// actions that actually help.
const isUnreachable = computed(
	() => props.error?.statusMessage === "server-unreachable",
);

// The server the app is pointed at, to name in the unreachable message.
const serverLabel = computed(() => override.value ?? defaultUrl);

const errorConfig = computed(() => {
	const code = props.error?.statusCode || 500;
	if (code === 404)
		return {
			title: t("error.notFound.title"),
			description: t("error.notFound.description"),
		};
	if (code === 403)
		return {
			title: t("error.forbidden.title"),
			description: t("error.forbidden.description"),
		};
	if (code === 401)
		return {
			title: t("error.unauthorized.title"),
			description: t("error.unauthorized.description"),
		};
	if (code >= 500)
		return {
			title: t("error.server.title"),
			description: t("error.server.description"),
		};
	return {
		title: t("error.generic.title"),
		description: props.error?.message || t("error.generic.description"),
	};
});

function handleGoBack(): void {
	if (window.history.length > 1) window.history.back();
	else clearError({ redirect: "/" });
}

function handleRefresh(): void {
	window.location.reload();
}

function handleGoHome(): void {
	clearError({ redirect: "/" });
}

// Take the user to the login screen, where the Server URL field and the
// pre-flight "Check server" check live — the place to re-check or change the URL.
function handleServerSettings(): void {
	clearError({ redirect: "/auth/login" });
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <header class="flex items-center justify-end px-6 py-4">
      <ThemeToggle />
    </header>

    <main class="flex flex-1 items-center justify-center px-4">
      <!-- Server unreachable: the self-hosted server isn't answering. Named, with
           the actions that resolve it — not a dead status code. -->
      <div
        v-if="isUnreachable"
        class="max-w-sm space-y-6 text-center"
      >
        <div class="flex justify-center">
          <div class="rounded-full bg-muted p-4 text-muted-foreground">
            <ServerOff :size="32" />
          </div>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ t("error.unreachable.title") }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ t("error.unreachable.description") }}
          </p>
          <p class="font-mono text-xs text-muted-foreground/80">
            {{ serverLabel }}
          </p>
        </div>

        <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="outline"
            class="w-full sm:w-auto"
            @click="handleRefresh"
          >
            <RefreshCw :size="16" class="mr-2" />
            {{ t("error.actions.retry") }}
          </Button>
          <Button class="w-full sm:w-auto" @click="handleServerSettings">
            <ServerOff :size="16" class="mr-2" />
            {{ t("error.actions.serverSettings") }}
          </Button>
        </div>
      </div>

      <!-- Generic HTTP-code error (404 / 403 / 5xx / fatal). -->
      <div v-else class="max-w-sm space-y-6 text-center">
        <div class="select-none text-8xl font-bold text-muted-foreground/20">
          {{ error?.statusCode || 500 }}
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ errorConfig.title }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ errorConfig.description }}
          </p>
        </div>

        <div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="outline" class="w-full sm:w-auto" @click="handleGoBack">
            <ArrowLeft :size="16" class="mr-2" />
            {{ t("error.actions.goBack") }}
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="handleRefresh">
            <RefreshCw :size="16" class="mr-2" />
            {{ t("error.actions.retry") }}
          </Button>
          <Button class="w-full sm:w-auto" @click="handleGoHome">
            <Home :size="16" class="mr-2" />
            {{ t("error.actions.home") }}
          </Button>
        </div>
      </div>
    </main>
  </div>
</template>
