<script setup lang="ts">
/**
 * The Nvisy brand mark — three redacted lines (two full, one short), the
 * product's core act: sensitive content concealed. Rendered as inline SVG in a
 * single color (`currentColor`), so it tints with any `text-*` class and works
 * on any background, light or dark. Use it for in-app branding: the login
 * header, empty states, the about panel.
 *
 * The tiled, gradient app-icon variant lives in the desktop shell's
 * `tauri/assets/` and is icon-only; this flat mark is the one for the UI.
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
    <!-- Thin bars with generous air (weight close to accompanying text), the
         three-bar block centered in the viewBox. Full bars width 80, short bar
         62%; radius = half height for fully rounded caps. -->
    <rect x="10" y="17" width="80" height="13" rx="6.5" />
    <rect x="10" y="44" width="80" height="13" rx="6.5" />
    <rect x="10" y="71" width="50" height="13" rx="6.5" />
  </svg>
</template>
