<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const isScrolled = ref(false);
const scrollThreshold = 50;
let lastScrollY = 0;
let ticking = false;

const updateHeader = () => {
	const scrollY = window.scrollY;
	const scrollingDown = scrollY > lastScrollY;

	// Use hysteresis: different thresholds based on scroll direction
	if (scrollingDown) {
		if (scrollY > scrollThreshold) {
			isScrolled.value = true;
		}
	} else {
		if (scrollY < scrollThreshold - 20) {
			isScrolled.value = false;
		}
	}

	lastScrollY = scrollY;
	ticking = false;
};

const handleScroll = () => {
	if (!ticking) {
		requestAnimationFrame(updateHeader);
		ticking = true;
	}
};

onMounted(() => {
	window.addEventListener("scroll", handleScroll, { passive: true });
	lastScrollY = window.scrollY;
	isScrolled.value = lastScrollY > scrollThreshold;
});

onUnmounted(() => {
	window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <header
    class="sticky top-0 z-50 w-full transition-all duration-300 border-b border-border/30"
  >
    <!-- Gradient background: solid at top, transparent at bottom 15% -->
    <div
      class="absolute inset-0 transition-all duration-300"
      :class="[
        isScrolled
          ? 'bg-gradient-to-b from-background/95 from-85% to-background/70 backdrop-blur-xl backdrop-saturate-150'
          : 'bg-gradient-to-b from-background/80 from-85% to-background/40 backdrop-blur-xl backdrop-saturate-150',
      ]"
    />

    <div
      class="container relative mx-auto px-4 md:px-8 lg:px-12 transition-all duration-300"
    >
      <div
        class="flex items-center justify-between gap-8 transition-[height] duration-300 ease-out"
        :class="[isScrolled ? 'h-11 md:h-12' : 'h-11 md:h-14']"
      >
        <slot />
      </div>
    </div>
    <slot name="mobile-menu" />
  </header>
</template>
