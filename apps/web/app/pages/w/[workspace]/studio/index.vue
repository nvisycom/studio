<script setup lang="ts">
import { useEventListener } from "@vueuse/core";
import { GripVertical } from "@lucide/vue";
import {
	StudioDocumentPreview,
	StudioChatPanel,
} from "#console/components/pages/studio";

useHead({ title: "Studio" });

definePageMeta({
	pageCategory: "header.category.studio",
});

// Use studio files store for persistent open files
const { activeFile } = useStudioFiles();

// File type detection
const fileExtension = computed(() => {
	const fileName = activeFile.value?.displayName || "";
	const ext = fileName.split(".").pop()?.toLowerCase() || "";
	return ext;
});

const isImageFile = computed(() => {
	const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];
	return imageExtensions.includes(fileExtension.value);
});

const isTextFile = computed(() => {
	const textExtensions = [
		"txt",
		"md",
		"log",
		"csv",
		"json",
		"xml",
		"yaml",
		"yml",
	];
	return textExtensions.includes(fileExtension.value);
});

const zoomLevel = ref(100);

// Chat panel state
const chatVisible = ref(true);
const chatWidth = ref(400);
const savedChatWidth = ref(400);
const isAnimating = ref(false);
const isResizing = ref(false);

const minChatWidth = 320;
const maxChatWidth = 800;

function zoomIn() {
	if (zoomLevel.value < 200) {
		zoomLevel.value += 10;
	}
}

function zoomOut() {
	if (zoomLevel.value > 50) {
		zoomLevel.value -= 10;
	}
}

function toggleChat() {
	if (isAnimating.value) return;

	isAnimating.value = true;

	if (chatVisible.value) {
		// Save current width before closing
		savedChatWidth.value = chatWidth.value;
		chatWidth.value = 0;
		setTimeout(() => {
			chatVisible.value = false;
			isAnimating.value = false;
		}, 300);
	} else {
		// Restore saved width
		chatVisible.value = true;
		nextTick(() => {
			chatWidth.value = savedChatWidth.value;
			setTimeout(() => {
				isAnimating.value = false;
			}, 300);
		});
	}
}

// Resize handling. useEventListener auto-removes on scope dispose, so a
// mid-drag unmount can't leak document listeners.
function startResize(e: MouseEvent) {
	if (isAnimating.value) return;

	isResizing.value = true;
	const startX = e.clientX;
	const startWidth = chatWidth.value;

	const stopMove = useEventListener(document, "mousemove", (ev: MouseEvent) => {
		const delta = startX - ev.clientX;
		chatWidth.value = Math.min(
			Math.max(startWidth + delta, minChatWidth),
			maxChatWidth,
		);
	});

	const stopUp = useEventListener(document, "mouseup", () => {
		isResizing.value = false;
		stopMove();
		stopUp();
	});
}
</script>

<template>
  <div class="absolute inset-0 overflow-hidden bg-muted/30 flex">
    <!-- Main Canvas Panel -->
    <div class="flex-1 min-w-0 h-full">
      <StudioDocumentPreview
        :content-url="activeFile?.contentUrl || null"
        :display-name="activeFile?.displayName || ''"
        :is-loading="activeFile?.isLoading || false"
        :is-image="isImageFile"
        :is-text="isTextFile"
        :zoom-level="zoomLevel"
        :chat-visible="chatVisible"
        @zoom-in="zoomIn"
        @zoom-out="zoomOut"
        @toggle-chat="toggleChat"
      />
    </div>

    <!-- Chat Panel with Resize Handle -->
    <div
      class="h-full flex overflow-hidden"
      :class="{ 'transition-[width] duration-300 ease-in-out': !isResizing }"
      :style="{ width: chatVisible || isAnimating ? `${chatWidth}px` : '0px' }"
    >
      <!-- Resize Handle -->
      <div
        v-if="chatVisible"
        class="w-px h-full cursor-col-resize flex items-center justify-center bg-border relative after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 flex-shrink-0 group"
        @mousedown="startResize"
      >
        <div
          class="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border"
        >
          <GripVertical class="size-2.5" />
        </div>
      </div>

      <!-- Chat Content -->
      <div
        v-if="chatVisible || isAnimating"
        class="flex-1 h-full min-w-0 overflow-hidden"
      >
        <StudioChatPanel />
      </div>
    </div>
  </div>
</template>
