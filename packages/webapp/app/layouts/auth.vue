<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Main Content -->
    <div class="flex-1">
      <slot />
    </div>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>
