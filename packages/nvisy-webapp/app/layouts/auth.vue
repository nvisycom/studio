<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue";
</script>

<template>
  <div
    class="min-h-screen flex flex-col border-t border-neutral-200 dark:border-neutral-800"
  >
    <!-- Main Content -->
    <div class="flex-1 flex">
      <!-- Left Side: Animated Gradient -->
      <div
        class="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950 isolate"
      >
        <div
          class="absolute inset-y-0 left-0 w-[200%] bg-gradient-to-r from-neutral-800 to-transparent to-50% dark:from-neutral-300 dark:to-transparent animate-gradient-shift"
        />
      </div>

      <!-- Right Side: Form -->
      <div
        class="flex-1 flex items-center justify-center bg-neutral-50 dark:bg-neutral-950"
      >
        <div class="w-full max-w-[480px]">
          <slot />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<style scoped>
.animate-gradient-shift {
  animation: gradientShift 24s ease-in-out infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    transform: translateX(-25%);
  }
  50% {
    transform: translateX(0%);
  }
}
</style>
