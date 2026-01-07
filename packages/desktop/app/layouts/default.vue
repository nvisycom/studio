<template>
  <div class="h-screen flex flex-col bg-background overflow-hidden">
    <!-- Fixed Header -->
    <AppHeader class="flex-shrink-0" />

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <div class="flex-1 overflow-auto">
        <slot />
      </div>
    </main>

    <!-- Fixed Footer -->
    <AppFooter class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
import "~/assets/tailwind.css";

// Layout meta for Nuxt
definePageMeta({
	layout: false,
});
</script>

<style scoped>
/* Additional layout-specific styles can be added here */
</style>
