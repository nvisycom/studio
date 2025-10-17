<template>
  <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="container flex h-14 max-w-screen-2xl items-center">
      <!-- Logo/Brand -->
      <div class="mr-4 hidden md:flex">
        <NuxtLink to="/" class="mr-4 flex items-center space-x-2 lg:mr-6">
          <div class="hidden font-bold sm:inline-block">
            Nvisy
          </div>
        </NuxtLink>

        <!-- Main Navigation -->
        <nav class="flex items-center gap-4 text-sm lg:gap-6">
          <NuxtLink
            to="/"
            class="transition-colors hover:text-foreground/80 text-foreground/60"
            :class="{ 'text-foreground': route.path === '/' }"
          >
            Home
          </NuxtLink>
        </nav>
      </div>

      <!-- Mobile menu button -->
      <Button
        variant="ghost"
        class="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        @click="toggleMobileMenu"
      >
        <svg
          :class="{ 'hidden': isMobileMenuOpen }"
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <svg
          :class="{ 'hidden': !isMobileMenuOpen }"
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span class="sr-only">Toggle Menu</span>
      </Button>

      <!-- Right side actions -->
      <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
        <div class="w-full flex-1 md:w-auto md:flex-none">
          <!-- Search or other components can go here -->
        </div>

        <!-- Theme toggle -->
        <Button
          variant="ghost"
          size="icon"
          @click="toggleColorMode"
          aria-label="Toggle theme"
        >
          <svg
            v-if="colorMode.value === 'dark'"
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <svg
            v-else
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="isMobileMenuOpen" class="border-t md:hidden">
      <nav class="container py-4 space-y-4">
        <NuxtLink
          to="/"
          class="block px-3 py-2 text-base font-medium transition-colors hover:text-foreground/80 text-foreground/60"
          :class="{ 'text-foreground': route.path === '/' }"
          @click="closeMobileMenu"
        >
          Home
        </NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from "@nvisy/shared/ui/button";

// Composables
const route = useRoute();
const colorMode = useColorMode();

// Mobile menu state
const isMobileMenuOpen = ref(false);

// Mobile menu methods
const toggleMobileMenu = () => {
	isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
	isMobileMenuOpen.value = false;
};

// Theme toggle
const toggleColorMode = () => {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
};

// Close mobile menu on route change
watch(
	() => route.path,
	() => {
		closeMobileMenu();
	},
);

// Close mobile menu on escape key
onMounted(() => {
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			closeMobileMenu();
		}
	};

	document.addEventListener("keydown", handleKeydown);

	onUnmounted(() => {
		document.removeEventListener("keydown", handleKeydown);
	});
});
</script>
