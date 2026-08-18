<script setup lang="ts">
/**
 * Image preview: the file rendered at the current zoom. Its own component so the
 * parent just branches on the file kind (parallel to the other studio views),
 * and so image-specific features (entity overlays / bounding boxes on detected
 * regions, pan) can be added here without touching the dispatcher.
 */
defineProps<{
	/** Blob object URL of the image, or null when nothing is open. */
	contentUrl: string | null;
	/** File name, used as the image alt text. */
	displayName: string;
	/** Zoom percentage (100 = actual size). */
	zoomLevel: number;
}>();
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-6">
    <div
      class="flex-shrink-0 shadow-lg"
      :style="{
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top center',
      }"
    >
      <img
        v-if="contentUrl"
        :src="contentUrl"
        :alt="displayName"
        class="max-w-[800px] bg-white"
      />
    </div>
  </div>
</template>
