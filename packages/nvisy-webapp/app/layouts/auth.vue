<script setup lang="ts">
import AppFooter from "@/components/AppFooter.vue";
import GradientShader from "@/components/effects/GradientShader.vue";
</script>

<template>
  <div class="min-h-screen flex flex-col overflow-hidden">
    <!-- Main Content -->
    <div class="flex-1 flex relative">
      <!-- Full-width gradient background -->
      <div class="absolute inset-0">
        <GradientShader />
      </div>

      <!-- Bottom gradient fade to footer color -->
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

      <!-- Left Side: Empty space with gradient showing through -->
      <div class="hidden lg:flex lg:w-1/2 relative" />

      <!-- Right Side: Form -->
      <div class="flex-1 flex items-center justify-center relative z-10">
        <div class="w-full max-w-[480px]">
          <slot />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <AppFooter class="relative z-10" />
  </div>
</template>
