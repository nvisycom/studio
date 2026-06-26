<script setup lang="ts">
import ThemeToggle from "@/components/footer/ThemeToggle.vue";
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

    <!-- Main Content -->
    <main
      class="flex-1 flex items-center justify-center relative z-10 px-4 py-8"
    >
      <div class="w-full max-w-[400px]">
        <slot />
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
