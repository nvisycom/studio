<script setup lang="ts">
import { PanelRightClose, PanelRightOpen } from "@lucide/vue";
import { Button } from "#console/components/ui/button";

/**
 * The floating chat/inspector toggle over the document preview. Zoom used to live
 * here too, but each preview view now owns its own zoom (the image and audio
 * views), so this is only the inspector toggle.
 */
interface Props {
	chatVisible?: boolean;
}

type Emits = (e: "toggleChat") => void;

withDefaults(defineProps<Props>(), {
	chatVisible: true,
});

const emit = defineEmits<Emits>();

function toggleChat() {
	emit("toggleChat");
}
</script>

<template>
  <!-- Chat/inspector toggle (bottom right). -->
  <div class="absolute bottom-6 right-6 z-20">
    <Button
      variant="ghost"
      size="sm"
      class="h-7 w-7 p-0 bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-800 rounded-md"
      @click="toggleChat"
    >
      <PanelRightClose v-if="chatVisible" :size="14" />
      <PanelRightOpen v-else :size="14" />
    </Button>
  </div>
</template>
