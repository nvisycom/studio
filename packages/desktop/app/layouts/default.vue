<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import "@nvisy/shared/styles.css";

// Layout meta for Nuxt
definePageMeta({
	layout: false,
});
</script>

<style scoped>
/* Additional layout-specific styles can be added here */
</style>
