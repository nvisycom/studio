<script setup lang="ts">
import type { NuxtError } from "#app";
import { ArrowLeft, Home, RefreshCw } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";

const props = defineProps<{
	error: NuxtError;
}>();

const errorConfig = computed(() => {
	const code = props.error?.statusCode || 500;
	if (code === 404)
		return {
			title: "Page not found",
			description: "This page doesn't exist or has been moved.",
		};
	if (code === 403)
		return {
			title: "Access denied",
			description: "You don't have permission to access this page.",
		};
	if (code === 401)
		return {
			title: "Unauthorized",
			description: "Please sign in to access this page.",
		};
	if (code >= 500)
		return {
			title: "Something went wrong",
			description: "We're having trouble loading this. Please try again.",
		};
	return {
		title: "An error occurred",
		description: props.error?.message || "Something unexpected happened.",
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
</script>

<template>
  <div class="relative flex min-h-screen flex-col bg-background">
    <header class="flex items-center justify-end px-6 py-4">
      <ThemeToggle />
    </header>

    <main class="flex flex-1 items-center justify-center px-4">
      <div class="max-w-sm space-y-6 text-center">
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

        <div
          class="flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button variant="outline" class="w-full sm:w-auto" @click="handleGoBack">
            <ArrowLeft :size="16" class="mr-2" />
            Go back
          </Button>
          <Button variant="outline" class="w-full sm:w-auto" @click="handleRefresh">
            <RefreshCw :size="16" class="mr-2" />
            Try again
          </Button>
          <Button class="w-full sm:w-auto" @click="handleGoHome">
            <Home :size="16" class="mr-2" />
            Home
          </Button>
        </div>
      </div>
    </main>
  </div>
</template>
