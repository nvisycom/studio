<script setup lang="ts">
import { computed } from "vue";
import { ArrowLeft, Home, RefreshCw } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import GradientShader from "@/components/effects/GradientShader.vue";
import ThemeToggle from "@/components/footer/ThemeToggle.vue";

interface NuxtError {
  statusCode: number;
  message: string;
  stack?: string;
}

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
  <div class="min-h-screen flex flex-col relative">
    <!-- Gradient Background -->
    <div class="absolute inset-0">
      <GradientShader />
    </div>

    <!-- Bottom gradient fade -->
    <div
      class="absolute bottom-0 left-0 right-0 h-[5vh] pointer-events-none z-[5]"
      style="
        background: linear-gradient(
          to bottom,
          transparent 0%,
          hsl(var(--background)) 100%
        );
      "
    />

    <!-- Content -->
    <div class="flex-1 flex items-center justify-center relative z-10 px-4">
      <Empty class="border-none max-w-md">
        <EmptyContent>
          <!-- Error Code -->
          <div class="mb-4">
            <span
              class="text-8xl md:text-9xl font-bold text-black/20 dark:text-white/20"
            >
              {{ error?.statusCode || 500 }}
            </span>
          </div>

          <!-- Title -->
          <EmptyTitle
            class="text-2xl md:text-3xl font-semibold text-black dark:text-white"
          >
            {{ errorConfig.title }}
          </EmptyTitle>

          <!-- Description -->
          <EmptyDescription
            class="text-base font-medium text-neutral-700 dark:text-neutral-300"
          >
            {{ errorConfig.description }}
          </EmptyDescription>

          <!-- Actions -->
          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6"
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
              Go home
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>

    <!-- Footer with theme toggle -->
    <div class="h-16 relative z-10 flex items-center justify-center">
      <ThemeToggle />
    </div>
  </div>
</template>
