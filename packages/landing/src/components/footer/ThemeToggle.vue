<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Sun, Moon } from "lucide-vue-next";

const isDark = ref(false);

function updateThemeColor(dark: boolean) {
  // Update theme-color meta tag for Safari tab bar
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", dark ? "#000000" : "#ffffff");
  }
}

function initTheme() {
  // Get stored theme or use system preference
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = stored ? stored === "dark" : prefersDark;

  // Apply theme
  isDark.value = shouldBeDark;
  if (shouldBeDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Update theme color for Safari
  updateThemeColor(shouldBeDark);

  // Store preference
  localStorage.setItem("theme", shouldBeDark ? "dark" : "light");
}

function toggleTheme() {
  isDark.value = !isDark.value;

  if (isDark.value) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }

  // Update theme color for Safari
  updateThemeColor(isDark.value);
}

onMounted(() => {
  initTheme();
});
</script>

<template>
  <button
    @click="toggleTheme"
    class="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-black dark:hover:bg-neutral-900 border border-transparent dark:border-neutral-800 transition-colors duration-200"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <!-- Sun icon (shown in dark mode) -->
    <Sun v-show="isDark" class="w-5 h-5 text-gray-600 dark:text-neutral-300" />

    <!-- Moon icon (shown in light mode) -->
    <Moon
      v-show="!isDark"
      class="w-5 h-5 text-gray-600 dark:text-neutral-300"
    />
  </button>
</template>
