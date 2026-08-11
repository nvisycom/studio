<script setup lang="ts">
import { FileText, Loader2 } from "@lucide/vue";
import { ZoomControls } from "#console/components/pages/documents";

const props = defineProps<{
	contentUrl: string | null;
	displayName: string;
	isLoading: boolean;
	isImage: boolean;
	isText: boolean;
	zoomLevel: number;
	chatVisible: boolean;
}>();

const emit = defineEmits<{
	"zoom-in": [];
	"zoom-out": [];
	"toggle-chat": [];
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
          class="mx-auto max-w-4xl whitespace-pre-wrap break-words rounded-lg border border-border/50 bg-background p-4 font-mono text-xs leading-relaxed text-foreground"
          >{{ textContent }}</pre
        >
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
