<template>
  <div class="h-screen flex flex-col overflow-hidden relative">
    <!-- Gradient Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-pink-200/70 via-blue-200/50 to-purple-200/70 dark:from-pink-900/40 dark:via-blue-900/30 dark:to-purple-900/40" />

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

definePageMeta({
  layout: false,
});
</script>
