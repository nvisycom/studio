<script setup lang="ts">
import {
	AppOpenStatus,
	LanguageSwitcher,
	ThemeToggle,
} from "@/components/footer";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { ExternalLink } from "@lucide/vue";
import "vue-sonner/style.css";
</script>

<template>
  <footer class="h-11 border-t border-border/50 bg-background">
    <div
      class="h-full flex items-center justify-between px-4 text-xs font-normal text-muted-foreground"
    >
      <div class="flex items-center gap-3">
        <a
          href="https://docs.nvisy.com"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Documentation
          <ExternalLink :size="10" />
        </a>
        <Separator orientation="vertical" class="h-3" />
        <a
          href="https://docs.nvisy.com/api-reference"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          API Reference
          <ExternalLink :size="10" />
        </a>
        <Separator orientation="vertical" class="h-3" />
        <AppOpenStatus />
      </div>
      <div class="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </div>
  </footer>

  <ClientOnly>
    <Toaster />
  </ClientOnly>
</template>
