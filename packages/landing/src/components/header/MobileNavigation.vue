<script setup lang="ts">
import { ExternalLink, ChevronDown, Menu } from "lucide-vue-next";
import { ref } from "vue";
import { products, solutions, resources } from "./navigation-data";

// Mobile menu state
const mobileMenuOpen = ref(false);
const mobileProductsOpen = ref(false);
const mobileSolutionsOpen = ref(false);
const mobileResourcesOpen = ref(false);

const toggleMobileMenu = () => {
	mobileMenuOpen.value = !mobileMenuOpen.value;
};

const toggleMobileProducts = () => {
	mobileProductsOpen.value = !mobileProductsOpen.value;
};

const toggleMobileSolutions = () => {
	mobileSolutionsOpen.value = !mobileSolutionsOpen.value;
};

const toggleMobileResources = () => {
	mobileResourcesOpen.value = !mobileResourcesOpen.value;
};
</script>

<template>
  <div class="flex items-center space-x-3">
    <!-- Mobile Menu Button -->
    <button
      @click="toggleMobileMenu"
      class="md:hidden p-2 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-md"
    >
      <Menu class="w-5 h-5" />
    </button>
  </div>

  <!-- Mobile Navigation -->
  <div
    v-show="mobileMenuOpen"
    class="md:hidden border-t border-gray-200/50 dark:border-neutral-700/50 py-4 backdrop-blur-xl bg-white/95 dark:bg-black/95"
  >
    <nav class="flex flex-col space-y-3">
      <!-- Mobile Products -->
      <div class="px-2">
        <button
          @click="toggleMobileProducts"
          class="flex items-center justify-between w-full text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-all duration-300 py-1"
        >
          <span>Products</span>
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': mobileProductsOpen }"
          />
        </button>
        <div v-show="mobileProductsOpen" class="mt-2 pl-4 space-y-2">
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1"
          >
            Platforms
          </div>
          <a
            v-for="product in products.platforms"
            :key="product.title"
            :href="product.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <component :is="product.icon" class="w-6 h-6" />
            </span>
            {{ product.title }}
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Open Source
          </div>
          <a
            v-for="product in products.opensource"
            :key="product.title"
            :href="product.href"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <component :is="product.icon" class="w-6 h-6" />
            </span>
            <span class="flex items-center gap-1">
              {{ product.title }}
              <ExternalLink class="w-3 h-3" />
            </span>
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Features
          </div>
          <a
            v-for="feature in products.features"
            :key="feature.title"
            :href="feature.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <component :is="feature.icon" class="w-4 h-4" />
            </span>
            {{ feature.title }}
          </a>

          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Comparisons
          </div>
          <a
            v-for="comparison in products.comparisons"
            :key="comparison.title"
            :href="comparison.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <span
                class="w-4 h-4 flex items-center justify-center text-xs font-bold bg-gray-200 dark:bg-gray-700 rounded"
                >N</span
              >
            </span>
            {{ comparison.title }}
          </a>
        </div>
      </div>

      <!-- Mobile Solutions -->
      <div class="px-2">
        <button
          @click="toggleMobileSolutions"
          class="flex items-center justify-between w-full text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-all duration-300 py-1"
        >
          <span>Solutions</span>
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': mobileProductsOpen }"
          />
        </button>
        <div v-show="mobileSolutionsOpen" class="mt-2 pl-4 space-y-2">
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1"
          >
            By Use Case
          </div>
          <a
            v-for="solution in solutions.usecase"
            :key="solution.title"
            :href="solution.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0 flex items-center justify-center">
              <component :is="solution.icon" class="w-5 h-5" />
            </span>
            {{ solution.title }}
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            By Stage
          </div>
          <a
            v-for="solution in solutions.stage"
            :key="solution.title"
            :href="solution.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0 flex items-center justify-center">
              <component :is="solution.icon" class="w-5 h-5" />
            </span>
            {{ solution.title }}
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Success Stories
          </div>
          <a
            v-for="customer in products.customers"
            :key="customer.title"
            :href="customer.href"
            class="block p-3 text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 border border-blue-100 dark:border-blue-800/30 mt-2"
          >
            <div>
              <div class="font-medium text-sm">{{ customer.title }}</div>
              <div class="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                {{ customer.excerpt }}
              </div>
            </div>
          </a>
        </div>
      </div>

      <!-- Mobile Resources -->
      <div class="px-2">
        <button
          @click="toggleMobileResources"
          class="flex items-center justify-between w-full text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-all duration-300 py-1"
        >
          <span>Resources</span>
          <ChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="{ 'rotate-180': mobileProductsOpen }"
          />
        </button>
        <div v-show="mobileResourcesOpen" class="mt-2 pl-4 space-y-2">
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1"
          >
            Developers
          </div>
          <a
            v-for="developer in resources.developers"
            :key="developer.title"
            :href="developer.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <component :is="developer.icon" class="w-6 h-6" />
            </span>
            {{ developer.title }}
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Support
          </div>
          <a
            v-for="support in resources.support"
            :key="support.title"
            :href="support.href"
            class="flex items-center text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-1 transition-colors text-sm"
          >
            <span class="mr-2 flex-shrink-0">
              <component :is="support.icon" class="w-6 h-6" />
            </span>
            {{ support.title }}
          </a>
          <div
            class="text-xs font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide mb-1 mt-3"
          >
            Blog
          </div>
          <a
            v-for="post in resources.blog"
            :key="post.title"
            :href="post.href"
            class="block text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-300 py-2 transition-colors text-sm"
          >
            <div class="font-medium">{{ post.title }}</div>
            <div class="text-xs text-gray-400 dark:text-neutral-500 mt-1">
              {{ post.excerpt }}
            </div>
          </a>
        </div>
      </div>

      <a
        href="/pricing"
        class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-all duration-300 px-2 py-1 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-md"
      >
        Pricing
      </a>
      <a
        href="/signin"
        class="text-gray-600 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white font-medium text-sm transition-all duration-300 px-2 py-1 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50 rounded-md"
      >
        Sign In
      </a>
    </nav>
  </div>
</template>
