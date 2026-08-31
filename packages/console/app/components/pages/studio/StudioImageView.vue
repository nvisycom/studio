<script setup lang="ts">
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * Image preview: the file rendered at the current zoom. A studio view (see the
 * shared contract in `useStudioView`); it reports its loading `phase` to the host
 * off the `<img>` load/error events. Its own component so image-specific features
 * (entity overlays / bounding boxes on detected regions, pan) can be added here.
 */
// Local interfaces (see the note in StudioDocxView on why the view contract is
// declared locally).
interface Props {
	/** Blob object URL of the image, or null when nothing is open. */
	contentUrl: string | null;
	/** File name, used as the image alt text. */
	displayName: string;
	/** Zoom percentage (100 = actual size). */
	zoomLevel?: number;
}
const props = defineProps<Props>();

const emit = defineEmits<{
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
}>();

// The browser fetches + decodes the image; report it as `downloading` until the
// <img> fires load (ready) or error.
watch(
	() => props.contentUrl,
	(url) => emit("phase", { status: url ? "downloading" : "idle" }),
	{ immediate: true },
);
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-6">
    <div
      class="flex-shrink-0 shadow-lg"
      :style="{
        transform: `scale(${(zoomLevel ?? 100) / 100})`,
        transformOrigin: 'top center',
      }"
    >
      <img
        v-if="contentUrl"
        :src="contentUrl"
        :alt="displayName"
        class="max-w-[800px] bg-white"
        @load="emit('phase', { status: 'ready' })"
        @error="emit('phase', { status: 'error' })"
      />
    </div>
  </div>
</template>
