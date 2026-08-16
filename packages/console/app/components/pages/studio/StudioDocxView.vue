<script setup lang="ts">
import { renderAsync } from "docx-preview";
import { Loader2, TriangleAlert } from "@lucide/vue";

/**
 * Read-only Word (.docx) preview. The download is the original OOXML zip, so it
 * is rendered client-side with docx-preview: the file is fetched from its blob
 * URL as an ArrayBuffer and rendered into a container element. No entity
 * highlighting yet — the audit overlay is plain-text + byte-offset only.
 */
const props = defineProps<{
	/** Blob object URL of the .docx file, or null when nothing is open. */
	contentUrl: string | null;
}>();

const { t } = useI18n();

const container = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const hasError = ref(false);

async function render(url: string, target: HTMLElement) {
	isLoading.value = true;
	hasError.value = false;
	target.replaceChildren();
	try {
		const buffer = await (await fetch(url)).arrayBuffer();
		// The file may have changed while the fetch was in flight.
		if (props.contentUrl !== url || container.value !== target) return;
		await renderAsync(buffer, target, undefined, {
			className: "docx",
			inWrapper: true,
			ignoreWidth: false,
			breakPages: true,
		});
	} catch {
		if (props.contentUrl === url) {
			hasError.value = true;
			target.replaceChildren();
		}
	} finally {
		if (props.contentUrl === url) isLoading.value = false;
	}
}

// Render whenever the file (or the container, after mount) changes.
watch(
	[() => props.contentUrl, container],
	([url, target]) => {
		if (!target) return;
		if (!url) {
			target.replaceChildren();
			hasError.value = false;
			isLoading.value = false;
			return;
		}
		render(url, target);
	},
	{ immediate: true },
);
</script>

<template>
  <div class="relative h-full overflow-auto">
    <div
      v-if="isLoading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <Loader2 :size="24" class="animate-spin text-muted-foreground" />
    </div>
    <div
      v-else-if="hasError"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center"
    >
      <TriangleAlert :size="24" class="text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ t("studio.preview.docxFailed") }}
      </p>
    </div>
    <!-- docx-preview renders the document (its own centered, paginated wrapper
         with a grey backdrop and white pages) into this element. -->
    <div ref="container" class="studio-docx" />
  </div>
</template>

<style scoped>
/* docx-preview ships its own layout (grey backdrop, centered white pages).
   Only re-tint the backdrop to the app's muted surface so it fits the theme;
   the page sizing, margins and shadow are left to the library. */
.studio-docx :deep(.docx-wrapper) {
	background: var(--muted);
	min-height: 100%;
}
</style>
