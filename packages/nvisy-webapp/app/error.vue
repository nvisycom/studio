<script setup lang="ts">
import { computed } from "vue";
import type { NuxtError } from "#app";
import { ArrowLeft, Home, RefreshCw } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/footer/ThemeToggle.vue";

const props = defineProps<{
	error: NuxtError;
}>();

const errorConfig = computed(() => {
	const code = props.error?.statusCode || 500;

	if (code === 404) {
		return {
			title: "Page not found",
			description:
				"The page you're looking for doesn't exist or has been moved.",
		};
	}

	if (code === 403) {
		return {
			title: "Access denied",
			description: "You don't have permission to access this page.",
		};
	}

	if (code === 401) {
		return {
			title: "Unauthorized",
			description: "Please sign in to access this page.",
		};
	}

	if (code >= 500) {
		return {
			title: "Something went wrong",
			description: "We're having trouble loading this page. Please try again.",
		};
	}

	return {
		title: "An error occurred",
		description: props.error?.message || "Something unexpected happened.",
	};
});

function handleGoBack(): void {
	if (window.history.length > 1) {
		window.history.back();
	} else {
		clearError({ redirect: "/" });
	}
}

function handleRefresh(): void {
	window.location.reload();
}

function handleGoHome(): void {
	clearError({ redirect: "/" });
}
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-background relative overflow-hidden"
  >
    <!-- Subtle gradient background -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- Top-left gradient blob -->
      <div
        class="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-violet-500/[0.07] to-transparent blur-3xl"
      />
      <!-- Bottom-right gradient blob -->
      <div
        class="absolute -bottom-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-gradient-to-tl from-blue-500/[0.07] to-transparent blur-3xl"
      />
      <!-- Grid pattern -->
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"
      />
    </div>

    <!-- Header -->
    <header class="relative z-10 flex items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="flex items-center gap-2 group">
        <span
          class="text-xl font-semibold tracking-tight group-hover:opacity-80 transition-opacity"
          >nvisy</span
        >
      </NuxtLink>
      <ThemeToggle />
    </header>

    <!-- Content -->
    <main class="flex-1 flex items-center justify-center relative z-10 px-4">
      <div class="text-center max-w-sm space-y-6">
        <!-- Error Code -->
        <div class="text-8xl font-bold text-muted-foreground/20 select-none">
          {{ error?.statusCode || 500 }}
        </div>

        <!-- Title & Description -->
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ errorConfig.title }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ errorConfig.description }}
          </p>
        </div>

        <!-- Actions -->
        <div
          class="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            variant="outline"
            @click="handleGoBack"
            class="w-full sm:w-auto"
          >
            <ArrowLeft :size="16" class="mr-2" />
            Go back
          </Button>

          <Button
            variant="outline"
            @click="handleRefresh"
            class="w-full sm:w-auto"
          >
            <RefreshCw :size="16" class="mr-2" />
            Try again
          </Button>

          <Button @click="handleGoHome" class="w-full sm:w-auto">
            <Home :size="16" class="mr-2" />
            Home
          </Button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer
      class="relative z-10 flex items-center justify-center px-6 py-4 text-xs text-muted-foreground"
    >
      <div class="flex items-center gap-4">
        <a
          href="https://nvisy.com/legal/privacy-policy"
          target="_blank"
          rel="noopener"
          class="hover:text-foreground transition-colors"
          >Privacy</a
        >
        <span class="text-muted-foreground/50">·</span>
        <a
          href="https://nvisy.com/legal/terms-of-service"
          target="_blank"
          rel="noopener"
          class="hover:text-foreground transition-colors"
          >Terms</a
        >
        <span class="text-muted-foreground/50">·</span>
        <a
          href="https://docs.nvisy.com"
          target="_blank"
          rel="noopener"
          class="hover:text-foreground transition-colors"
          >Docs</a
        >
      </div>
    </footer>
  </div>
</template>
