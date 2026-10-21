<script setup lang="ts">
/**
 * The Nvisy brand mark — "the ellipsis, dissolving": three dots fading left to
 * right (the Elide motif, the sensitive run omitted). Rendered as inline SVG in a
 * single color (`currentColor`) with the dissolve carried by opacity, so it tints
 * with any `text-*` class and works on any background, light or dark. Use it for
 * in-app branding: the login header, the launch splash, empty states.
 *
 * The tiled, glowing app-icon variant lives in the desktop shell's
 * `tauri/assets/`; this flat mark is the one for the UI.
 */
withDefaults(
	defineProps<{
		/** Square size in pixels (width and height). */
		size?: number;
	}>(),
	{ size: 24 },
);
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    fill="currentColor"
    role="img"
    aria-label="Nvisy"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Three dots dissolving left→right (centres 30/50/70, vertically centred),
         the dissolve carried by opacity 1 / .6 / .22 so the mark reads in one
         color on any ground. Mirrors the Elide app-icon rhythm. -->
    <circle cx="30" cy="50" r="7" />
    <circle cx="50" cy="50" r="7" opacity="0.6" />
    <circle cx="70" cy="50" r="7" opacity="0.22" />
  </svg>
</template>
