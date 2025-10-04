<script setup lang="ts">
import { Menu, X } from "lucide-vue-next";
import MobileProducts from "./MobileProducts.vue";
import MobileSolutions from "./MobileSolutions.vue";
import MobileResources from "./MobileResources.vue";
import { useMobileMenu } from "./useMobileMenu.ts";

defineProps<{
	menuOnly?: boolean;
}>();

const { mobileMenuOpen, toggleMobileMenu } = useMobileMenu();
</script>

<template>
  <!-- Mobile Menu Button -->
  <button
    v-if="!menuOnly"
    @click="toggleMobileMenu"
    class="lg:hidden p-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-md"
  >
    <X v-if="mobileMenuOpen" class="w-5 h-5" />
    <Menu v-else class="w-5 h-5" />
  </button>

  <!-- Mobile Navigation Menu -->
  <div
    v-if="menuOnly && mobileMenuOpen"
    class="lg:hidden border-t border-gray-200/50 dark:border-neutral-700/50 py-4 px-4 backdrop-blur-xl bg-white/95 dark:bg-black/95"
  >
    <nav class="flex flex-col space-y-3">
      <MobileProducts />
      <MobileSolutions />
      <MobileResources />

      <a
        href="/pricing"
        class="text-gray-900 dark:text-white font-medium text-base uppercase tracking-wide transition-all duration-300 px-2 py-2"
      >
        Pricing
      </a>
    </nav>
  </div>
</template>
