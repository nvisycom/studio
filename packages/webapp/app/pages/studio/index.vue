<script setup lang="ts">
import { ref, computed } from "vue";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  StudioDocumentPreview,
  StudioChatPanel,
} from "~/components/pages/studio";

definePageMeta({
  pageCategory: "Studio",
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

const zoomLevel = ref(100);

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
</script>

<template>
  <div
    class="absolute inset-0 overflow-hidden bg-neutral-100 dark:bg-neutral-950"
  >
    <ResizablePanelGroup direction="horizontal" class="h-full w-full">
      <!-- Main Canvas Panel -->
      <ResizablePanel :default-size="75" :min-size="50">
        <StudioDocumentPreview
          :content-url="activeFile?.contentUrl || null"
          :display-name="activeFile?.displayName || ''"
          :is-loading="activeFile?.isLoading || false"
          :is-image="isImageFile"
          :zoom-level="zoomLevel"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
        />
      </ResizablePanel>

      <ResizableHandle with-handle />

      <!-- Right Sidebar Panel -->
      <ResizablePanel :default-size="25" :min-size="20" :max-size="40">
        <StudioChatPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>
