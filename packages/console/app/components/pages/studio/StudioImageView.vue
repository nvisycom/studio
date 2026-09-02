<script setup lang="ts">
import { ZoomIn } from "@lucide/vue";
import type { StudioViewPhase } from "#console/composables/useStudioView";

/**
 * Image preview: the file rendered at an adjustable zoom. A studio view (see the
 * shared contract in `useStudioView`); it reports its loading `phase` to the host
 * off the `<img>` load/error events. Zoom is owned here (an inline slider) rather
 * than by a shared control — each zooming view manages its own zoom. Its own
 * component so image-specific features (entity overlays / bounding boxes on
 * detected regions, pan) can be added here.
 */
// Local interfaces (see the note in StudioDocxView on why the view contract is
// declared locally).
interface Props {
	/** Blob object URL of the image, or null when nothing is open. */
	contentUrl: string | null;
	/** File name, used as the image alt text. */
	displayName?: string;
}
defineProps<Props>();

const emit = defineEmits<{
	/** Loading phase, so the host shows the single loader/error. */
	phase: [phase: StudioViewPhase];
}>();

const { t } = useI18n();

// Zoom as a percentage (100 = actual size); the slider drives it directly.
const ZOOM_MIN = 25;
const ZOOM_MAX = 300;
const zoom = ref(100);

function onZoomInput(event: Event) {
	zoom.value = Number((event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex min-h-full flex-col items-center gap-4 py-6">
    <div class="flex-1 overflow-auto">
      <div
        class="flex-shrink-0 shadow-lg"
        :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }"
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

    <!-- Inline zoom (this view owns its zoom, not a shared control). -->
    <div
      class="sticky bottom-6 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 shadow-lg"
    >
      <ZoomIn :size="14" class="text-muted-foreground" />
      <input
        type="range"
        :min="ZOOM_MIN"
        :max="ZOOM_MAX"
        step="5"
        :value="zoom"
        class="h-1 w-32 cursor-pointer accent-primary"
        :aria-label="t('studio.preview.zoom')"
        @input="onZoomInput"
      />
      <span class="min-w-[38px] text-right font-mono text-xs tabular-nums text-muted-foreground">
        {{ zoom }}%
      </span>
    </div>
  </div>
</template>
