<script setup lang="ts">
import { FileText, Loader2 } from "lucide-vue-next";
import { ZoomControls } from "~/components/pages/documents";

const props = defineProps<{
	contentUrl: string | null;
	displayName: string;
	isLoading: boolean;
	isImage: boolean;
	zoomLevel: number;
	chatVisible: boolean;
}>();

const emit = defineEmits<{
	"zoom-in": [];
	"zoom-out": [];
	"toggle-chat": [];
}>();
</script>

<template>
  <div class="h-full overflow-hidden relative">
    <div class="h-full overflow-y-auto">
      <!-- Loading state -->
      <div v-if="isLoading" class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <Loader2 :size="32" class="mx-auto mb-3 animate-spin" />
          <p class="text-sm font-light">Loading document...</p>
        </div>
      </div>

      <!-- No file selected state -->
      <div
        v-else-if="!contentUrl"
        class="h-full flex items-center justify-center"
      >
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-light">No document selected</p>
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

      <!-- Unsupported file type -->
      <div v-else class="h-full flex items-center justify-center">
        <div class="text-center text-muted-foreground">
          <FileText :size="64" class="mx-auto mb-4 opacity-20" />
          <p class="text-sm font-light">{{ displayName }}</p>
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
