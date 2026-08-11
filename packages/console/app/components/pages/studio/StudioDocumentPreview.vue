<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";
import type { TextEntityView } from "#console/composables/useTextEntities";

const props = withDefaults(
	defineProps<{
		contentUrl: string | null;
		displayName: string;
		isLoading: boolean;
		isImage: boolean;
		isText: boolean;
		zoomLevel: number;
		chatVisible: boolean;
		/** Detected entities to highlight in the text (byte-offset spans). */
		entities?: TextEntityView[];
		/** Currently focused entity id, for the ring + scroll-into-view. */
		activeEntityId?: string | null;
	}>(),
	{ entities: () => [], activeEntityId: null },
);

const emit = defineEmits<{
	"zoom-in": [];
	"zoom-out": [];
	"toggle-chat": [];
	"focus-entity": [id: string];
}>();

// Text preview: the content URL is a blob object URL, so read its text and
// render it in a <pre>. Re-fetch whenever the file (URL) changes.
const textContent = ref<string | null>(null);
const isLoadingText = ref(false);
const textError = ref(false);

watch(
	() => [props.contentUrl, props.isText] as const,
	async ([url, isText]) => {
		textContent.value = null;
		textError.value = false;
		if (!url || !isText) return;
		isLoadingText.value = true;
		try {
			const response = await fetch(url);
			textContent.value = await response.text();
		} catch {
			textError.value = true;
		} finally {
			isLoadingText.value = false;
		}
	},
	{ immediate: true },
);

// Entity offsets are UTF-8 *byte* positions; JS strings are UTF-16. Build a
// byte→char-index map so spans slice the string at the right code units.
const byteToChar = computed<number[] | null>(() => {
	const text = textContent.value;
	if (!text || props.entities.length === 0) return null;
	const encoder = new TextEncoder();
	// Map[b] = char index at byte offset b. One entry per byte boundary + end.
	const map: number[] = [];
	let byte = 0;
	for (let i = 0; i < text.length; i++) {
		const codePoint = text.codePointAt(i)!;
		const width = encoder.encode(String.fromCodePoint(codePoint)).length;
		const isSurrogatePair = codePoint > 0xffff;
		for (let b = 0; b < width; b++) map[byte + b] = i;
		byte += width;
		if (isSurrogatePair) i++; // skip the low surrogate
	}
	map[byte] = text.length; // end sentinel
	return map;
});

/** A rendered run of text: either plain, or an entity span to highlight. */
interface Segment {
	text: string;
	entity: TextEntityView | null;
}

// Split the document into plain + entity segments, in order, skipping any
// overlapping/out-of-range spans defensively.
const segments = computed<Segment[]>(() => {
	const text = textContent.value;
	const map = byteToChar.value;
	if (!text) return [];
	if (!map) return [{ text, entity: null }];

	const spans = [...props.entities]
		.map((e) => ({ e, start: map[e.start], end: map[e.end] }))
		.filter(
			(s): s is { e: TextEntityView; start: number; end: number } =>
				s.start != null && s.end != null && s.end > s.start,
		)
		.sort((a, b) => a.start - b.start);

	const out: Segment[] = [];
	let cursor = 0;
	for (const { e, start, end } of spans) {
		if (start < cursor) continue; // overlap — keep the earlier span
		if (start > cursor)
			out.push({ text: text.slice(cursor, start), entity: null });
		out.push({ text: text.slice(start, end), entity: e });
		cursor = end;
	}
	if (cursor < text.length)
		out.push({ text: text.slice(cursor), entity: null });
	return out;
});

// Scroll the focused entity into view when it changes.
const textEl = ref<HTMLElement | null>(null);
watch(
	() => props.activeEntityId,
	(id) => {
		if (!id) return;
		nextTick(() => {
			textEl.value
				?.querySelector<HTMLElement>(`[data-entity="${id}"]`)
				?.scrollIntoView({ block: "center", behavior: "smooth" });
		});
	},
);
</script>

<template>
  <div class="h-full overflow-hidden relative">
    <div class="h-full overflow-y-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <Loader2 :size="32" class="mx-auto mb-3 animate-spin" />
          <p class="text-sm font-normal">Loading document...</p>
        </div>
      </div>

      <!-- No file selected state -->
      <div
        v-else-if="!contentUrl"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-normal">No document selected</p>
          <p class="text-xs mt-2">
            Select a file from the Files page to preview
          </p>
        </div>
      </div>

      <!-- Image file preview -->
      <div v-else-if="isImage" class="flex flex-col items-center gap-4 py-6">
        <div
          class="flex-shrink-0 shadow-lg"
          :style="{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }"
        >
          <img
            :src="contentUrl"
            :alt="displayName"
            class="max-w-[800px] bg-white"
          />
        </div>
      </div>

      <!-- Text file preview -->
      <div v-else-if="isText" class="min-h-full p-6">
        <div
          v-if="isLoadingText"
          class="h-full flex items-center justify-center text-muted-foreground"
        >
          <Loader2 :size="24" class="animate-spin" />
        </div>
        <div
          v-else-if="textError"
          class="h-full flex items-center justify-center text-center text-muted-foreground"
        >
          <p class="text-sm">Unable to load this file.</p>
        </div>
        <pre
          v-else
          ref="textEl"
          class="mx-auto max-w-4xl whitespace-pre-wrap break-words rounded-lg border border-border/50 bg-background p-4 font-mono text-xs leading-relaxed text-foreground"
        ><template v-for="(seg, i) in segments" :key="i"><mark
            v-if="seg.entity"
            :data-entity="seg.entity.id"
            :title="seg.entity.label"
            class="cursor-pointer rounded-[3px] bg-muted px-0.5 text-foreground ring-border transition-shadow hover:ring-1"
            :class="{ 'ring-2 ring-foreground': activeEntityId === seg.entity.id }"
            @click="emit('focus-entity', seg.entity.id)"
          >{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></pre>
      </div>

      <!-- Unsupported file type -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-normal">{{ displayName }}</p>
          <p class="text-xs mt-2">
            This file type is not supported for preview
          </p>
        </div>
      </div>
    </div>

    <!-- Zoom Controls -->
    <ZoomControls
      :zoom-level="zoomLevel"
      :chat-visible="chatVisible"
      @zoom-in="emit('zoom-in')"
      @zoom-out="emit('zoom-out')"
      @toggle-chat="emit('toggle-chat')"
    />
  </div>
</template>
