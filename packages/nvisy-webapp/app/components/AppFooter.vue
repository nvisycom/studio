<script setup lang="ts">
import {
	AppOpenStatus,
	LanguageSwitcher,
	ThemeToggle,
} from "@/components/footer";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { ExternalLink } from "lucide-vue-next";
import "vue-sonner/style.css";

const { t } = useI18n();
</script>

<template>
  <footer
    class="border-t border-neutral-200 dark:border-neutral-800 bg-background"
  >
    <div
      class="flex items-center justify-between px-4 py-3 text-sm font-normal text-neutral-600 dark:text-neutral-300"
    >
      <div class="flex items-center gap-3">
        <span>© {{ new Date().getFullYear() }} {{ t("common.service") }}</span>
        <Separator orientation="vertical" class="h-3" />
        <a
          href="https://docs.nvisy.com"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors"
        >
          Documentation
          <ExternalLink :size="10" />
        </a>
        <Separator orientation="vertical" class="h-3" />
        <a
          href="https://docs.nvisy.com/api-reference"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors"
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
