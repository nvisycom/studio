<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Check, Copy, ExternalLink, Package } from "@lucide/vue";
import TypeScriptIcon from "@/assets/languages/typescript.svg?raw";
import PythonIcon from "@/assets/languages/python.svg?raw";
import RustIcon from "@/assets/languages/rust.svg?raw";

interface SDK {
	name: string;
	language: string;
	githubUrl: string;
	order: number;
}

const props = defineProps<{
	sdks: SDK[];
}>();

const activeTab = ref(0);
const copied = ref(false);
const codeHtmlMap = ref<Record<string, string>>({});
const isTransitioning = ref(false);
const codeContainerRef = ref<HTMLDivElement | null>(null);

const activeSdk = computed(() => props.sdks[activeTab.value]);
const activeCodeHtml = computed(
	() => codeHtmlMap.value[activeSdk.value.name] || "",
);

const switchTab = (index: number) => {
	if (index === activeTab.value) return;

	// Lock the current height before switching
	if (codeContainerRef.value) {
		const currentHeight = codeContainerRef.value.offsetHeight;
		codeContainerRef.value.style.height = `${currentHeight}px`;
		// Force reflow to ensure height is applied
		void codeContainerRef.value.offsetHeight;
	}

	isTransitioning.value = true;

	setTimeout(() => {
		activeTab.value = index;

		// After content switch, measure and animate to new height
		requestAnimationFrame(() => {
			if (codeContainerRef.value) {
				// Get current fixed height
				const currentHeight = codeContainerRef.value.offsetHeight;

				// Temporarily set to auto to measure new content
				codeContainerRef.value.style.height = "auto";
				const newHeight = codeContainerRef.value.offsetHeight;

				// Immediately set back to current height
				codeContainerRef.value.style.height = `${currentHeight}px`;

				// Force reflow
				void codeContainerRef.value.offsetHeight;

				// Now animate to new height
				codeContainerRef.value.style.height = `${newHeight}px`;

				// After animation, remove fixed height
				setTimeout(() => {
					if (codeContainerRef.value) {
						codeContainerRef.value.style.height = "";
					}
					isTransitioning.value = false;
				}, 300);
			}
		});
	}, 150);
};

onMounted(() => {
	// Listen for code-ready event from Astro
	const container = document.querySelector("[data-sdk-showcase]");
	if (container) {
		container.addEventListener("code-ready", ((e: CustomEvent) => {
			codeHtmlMap.value = e.detail;
		}) as EventListener);

		// Also check if data is already available
		const codeAttr = container.getAttribute("data-code-html");
		if (codeAttr) {
			try {
				codeHtmlMap.value = JSON.parse(codeAttr);
			} catch (e) {
				console.error("Failed to parse code HTML data:", e);
			}
		}
	}
});

const copyCode = async () => {
	if (activeCodeHtml.value) {
		// Extract text content from the rendered HTML
		const tempDiv = document.createElement("div");
		tempDiv.innerHTML = activeCodeHtml.value;
		const codeText = tempDiv.querySelector("code")?.textContent || "";
		await navigator.clipboard.writeText(codeText);
		copied.value = true;
		setTimeout(() => {
			copied.value = false;
		}, 2000);
	}
};
</script>

<template>
  <div class="relative" data-sdk-showcase>
    <!-- Tabs & Actions Bar -->
    <div class="flex items-center justify-between mb-4">
      <!-- Language Tabs with Icons -->
      <div class="flex items-center gap-2">
        <button
          v-for="(sdk, index) in sdks"
          :key="sdk.name"
          @click="switchTab(index)"
          class="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2"
          :class="[
            activeTab === index
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800',
          ]"
        >
          <div
            v-if="sdk.name === 'TypeScript'"
            v-html="TypeScriptIcon"
            class="w-4 h-4 hidden sm:block [&>svg]:w-full [&>svg]:h-full"
            :class="activeTab === index ? 'sdk-icon-active' : 'sdk-icon'"
          ></div>
          <div
            v-else-if="sdk.name === 'Python'"
            v-html="PythonIcon"
            class="w-4 h-4 hidden sm:block [&>svg]:w-full [&>svg]:h-full"
            :class="activeTab === index ? 'sdk-icon-active' : 'sdk-icon'"
          ></div>
          <div
            v-else-if="sdk.name === 'Rust'"
            v-html="RustIcon"
            class="w-4 h-4 hidden sm:block [&>svg]:w-full [&>svg]:h-full"
            :class="activeTab === index ? 'sdk-icon-active' : 'sdk-icon'"
          ></div>
          <Package v-else class="w-4 h-4 hidden sm:block" />
          <span>{{ sdk.name }}</span>
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <a
          :href="activeSdk.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          title="View on GitHub"
        >
          <ExternalLink class="w-4 h-4" />
        </a>
        <button
          @click="copyCode"
          class="p-2 rounded-lg transition-all"
          :class="[
            copied
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800',
          ]"
          :title="copied ? 'Copied!' : 'Copy code'"
        >
          <Check v-if="copied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Code Display -->
    <div
      ref="codeContainerRef"
      class="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 transition-[height] duration-300 ease-out"
    >
      <div
        v-if="activeCodeHtml"
        v-html="activeCodeHtml"
        class="code-container transition-opacity duration-150"
        :class="isTransitioning ? 'opacity-0' : 'opacity-100'"
      />
      <div
        v-else
        class="p-6 text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900"
      >
        Loading code...
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-container :deep(.astro-code) {
  margin: 0;
  overflow-x: auto;
  border: none;
  border-radius: 0;
}

.code-container :deep(pre) {
  margin: 0;
  padding: 1.5rem;
  border: none;
  border-radius: 0;
}

.sdk-icon {
  filter: grayscale(100%);
}

.sdk-icon-active {
  filter: grayscale(100%);
}
</style>
