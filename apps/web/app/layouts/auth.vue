<script setup lang="ts">
import ThemeToggle from "#console/components/layout/footer/ThemeToggle.vue";
import LanguageSwitcher from "#console/components/layout/footer/LanguageSwitcher.vue";
import AuroraGlow from "@/components/auth/AuroraGlow.vue";

const { t } = useI18n();
</script>

<template>
  <div class="min-h-screen bg-background lg:grid lg:grid-cols-2">
    <!-- Left: the auth form -->
    <div class="relative flex min-h-screen flex-col lg:min-h-0">
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4">
        <NuxtLink to="/" class="group flex items-center gap-2">
          <span
            class="text-xl font-semibold tracking-tight transition-opacity group-hover:opacity-80"
            >nvisy</span
          >
        </NuxtLink>
        <div class="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <!-- Form -->
      <main class="flex flex-1 items-center justify-center px-4 py-8">
        <div class="w-full max-w-[400px]">
          <slot />
        </div>
      </main>

      <!-- Footer -->
      <footer
        class="flex items-center justify-center px-6 py-4 text-xs text-muted-foreground"
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

    <!-- Right: brand panel (large screens only) -->
    <aside
      class="relative hidden overflow-hidden border-l border-border/60 bg-muted/30 lg:flex lg:flex-col"
    >
      <!-- Drifting brand-colored aurora over a faint grid -->
      <div class="pointer-events-none absolute inset-0">
        <AuroraGlow />
        <div
          class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:3rem_3rem]"
        />
      </div>

      <div class="relative z-10 flex flex-1 flex-col px-14 pt-20">
        <div class="w-full max-w-md">
          <p
            class="text-4xl font-semibold leading-tight tracking-tight text-foreground"
          >
            {{ t("auth.panel.headline") }}
          </p>
          <p class="mt-5 text-base leading-relaxed text-muted-foreground">
            {{ t("auth.panel.subline") }}
          </p>
        </div>
      </div>
    </aside>
  </div>
</template>
