<script setup lang="ts">
import { NvisyLogo } from "#console/components/brand";

/**
 * The Nvisy logo lockup: the mark ({@link NvisyLogo}) beside the "nvisy"
 * wordmark, spaced and optically aligned as one unit. Use this wherever the
 * brand appears with its name (auth headers, nav). For the bare mark alone
 * (favicon, empty states, an avatar), use {@link NvisyLogo} directly.
 *
 * The mark is nudged down a hair against the text: the wordmark's `y` descender
 * lowers its box, so a plain center-align floats the mark above the text's
 * visual (x-height) center. The small offset centers it on the letters instead.
 */
withDefaults(
	defineProps<{
		/** Mark size in pixels; the wordmark scales from the same base. */
		size?: number;
	}>(),
	{ size: 24 },
);
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <NvisyLogo :size="size" class="mark" />
    <span
      class="font-semibold leading-none tracking-tight"
      :style="{ fontSize: `${size * 0.92}px` }"
      >nvisy</span
    >
  </span>
</template>

<style scoped>
/* Optical centering: shift the mark down by a fraction of its size so it aligns
   with the wordmark's x-height band, not its descender-lowered box center. */
.mark {
	transform: translateY(6%);
}
</style>
