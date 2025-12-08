<script setup lang="ts">
import {
	AppOpenStatus,
	LanguageSwitcher,
	ThemeToggle,
} from "@/components/footer";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";

const { t } = useI18n();
</script>

<template>
  <footer class="border-t border-neutral-200 dark:border-neutral-800 bg-background">
    <div class="flex items-center justify-between px-4 py-3 text-xs text-neutral-500 dark:text-neutral-600">
      <div class="flex items-center gap-3">
        <span>© {{ new Date().getFullYear() }} {{ t('common.service') }}</span>
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
    <Toaster/>
  </ClientOnly>
</template>
