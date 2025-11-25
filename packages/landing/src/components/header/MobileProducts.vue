<script setup lang="ts">
import { ExternalLink, ChevronDown } from "lucide-vue-next";
import { ref } from "vue";
import { products } from "./mobile-nav-data";

const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <div class="px-2">
    <button
      @click="toggle"
      class="flex items-center justify-between w-full text-gray-900 dark:text-white font-light text-base tracking-wide transition-all duration-300 py-2 uppercase"
    >
      <span>Products</span>
      <ChevronDown
        class="w-5 h-5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div v-show="isOpen" class="mt-3 pl-4">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <a
          v-for="product in products.platforms"
          :key="product.title"
          :href="product.href"
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ product.title }}
        </a>
        <a
          v-for="product in products.opensource"
          :key="product.title"
          :href="product.href"
          target="_blank"
          rel="noopener noreferrer"
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          <span class="flex items-center gap-1">
            {{ product.title }}
            <ExternalLink class="w-3 h-3" />
          </span>
        </a>
      </div>
    </div>
  </div>
</template>
