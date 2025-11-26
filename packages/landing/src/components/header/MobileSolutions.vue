<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { ref } from "vue";
import { solutions } from "./mobile-nav-data";

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
      <span>Solutions</span>
      <ChevronDown
        class="w-5 h-5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div v-show="isOpen" class="mt-3 pl-4">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <a
          v-for="solution in solutions.usecase"
          :key="solution.title"
          :href="solution.href"
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ solution.title }}
        </a>
        <a
          v-for="solution in solutions.stage"
          :key="solution.title"
          :href="solution.href"
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ solution.title }}
        </a>
      </div>
    </div>
  </div>
</template>
