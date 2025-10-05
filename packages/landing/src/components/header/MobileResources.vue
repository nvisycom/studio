<script setup lang="ts">
import { ChevronDown, ExternalLink } from "lucide-vue-next";
import { ref } from "vue";
import { resources } from "./mobile-nav-data";

const isOpen = ref(false);

const toggle = () => {
	isOpen.value = !isOpen.value;
};
</script>

<template>
  <div class="px-2">
    <button
      @click="toggle"
      class="flex items-center justify-between w-full text-gray-900 dark:text-white font-medium text-base uppercase tracking-wide transition-all duration-300 py-2"
    >
      <span>Resources</span>
      <ChevronDown
        class="w-5 h-5 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>
    <div v-show="isOpen" class="mt-3 pl-4">
      <div class="grid grid-cols-2 gap-x-4 gap-y-3">
        <a
          v-for="developer in resources.developers"
          :key="developer.title"
          :href="developer.href"
          :target="
            developer.title === 'Documentation' ||
            developer.title === 'API Reference'
              ? '_blank'
              : undefined
          "
          :rel="
            developer.title === 'Documentation' ||
            developer.title === 'API Reference'
              ? 'noopener noreferrer'
              : undefined
          "
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          <span class="flex items-center gap-1">
            {{ developer.title }}
            <ExternalLink
              v-if="
                developer.title === 'Documentation' ||
                developer.title === 'API Reference'
              "
              class="w-3 h-3"
            />
          </span>
        </a>
        <a
          v-for="support in resources.support"
          :key="support.title"
          :href="support.href"
          :target="support.isExternal ? '_blank' : undefined"
          :rel="support.isExternal ? 'noopener noreferrer' : undefined"
          class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          <span class="flex items-center gap-1">
            {{ support.title }}
            <ExternalLink v-if="support.isExternal" class="w-3 h-3" />
          </span>
        </a>
      </div>
    </div>
  </div>
</template>
