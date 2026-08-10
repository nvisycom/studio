<script setup lang="ts">
import ThemeToggle from "@/components/footer/ThemeToggle.vue";
</script>

<!--
  A sidebar-less, single-column centered frame for pages that are neither an
  auth form nor a workspace view: the "/" resolver (redirecting into a
  workspace) and the first-run onboarding. It shares the auth screens' chrome
  (wordmark header, legal footer, ambient background) but deliberately omits the
  brand panel — those are logged-in states, not a login pitch.
-->
<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-background">
    <!-- Ambient gradient + grid, matching the auth screens' background -->
    <div class="pointer-events-none absolute inset-0">
      <div
        class="absolute -top-[40%] -left-[20%] h-[70%] w-[70%] rounded-full bg-gradient-to-br from-violet-500/[0.07] to-transparent blur-3xl"
      />
      <div
        class="absolute -right-[20%] -bottom-[40%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-blue-500/[0.07] to-transparent blur-3xl"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:4rem_4rem]"
      />
    </div>

    <!-- Header -->
    <header class="relative z-10 flex items-center justify-between px-6 py-4">
      <NuxtLink to="/" class="group flex items-center gap-2">
        <span
          class="text-xl font-semibold tracking-tight transition-opacity group-hover:opacity-80"
          >nvisy</span
        >
      </NuxtLink>
      <ThemeToggle />
    </header>

    <!-- Main Content -->
    <main
      class="relative z-10 flex flex-1 items-center justify-center px-4 py-8"
    >
      <slot />
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
          class="transition-colors hover:text-foreground"
          >Privacy</a
        >
        <span class="text-muted-foreground/50">·</span>
        <a
          href="https://nvisy.com/legal/terms-of-service"
          target="_blank"
          rel="noopener"
          class="transition-colors hover:text-foreground"
          >Terms</a
        >
        <span class="text-muted-foreground/50">·</span>
        <a
          href="https://docs.nvisy.com"
          target="_blank"
          rel="noopener"
          class="transition-colors hover:text-foreground"
          >Docs</a
        >
      </div>
    </footer>
  </div>
</template>
