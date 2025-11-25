<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Check, Copy, ExternalLink, Package } from "lucide-vue-next";
import TypeScriptIcon from "@/assets/sdks/typescript.svg?raw";
import PythonIcon from "@/assets/sdks/python.svg?raw";

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

const activeSdk = computed(() => props.sdks[activeTab.value]);
const activeCodeHtml = computed(
  () => codeHtmlMap.value[activeSdk.value.name] || "",
);

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
          @click="activeTab = index"
          class="px-4 py-3 text-sm font-medium rounded-lg transition-all flex flex-col items-center gap-1.5 min-w-[100px]"
          :class="[
            activeTab === index
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800',
          ]"
        >
          <div
            v-if="sdk.name === 'TypeScript'"
            v-html="TypeScriptIcon"
            class="w-5 h-5"
          ></div>
          <div
            v-else-if="sdk.name === 'Python'"
            v-html="PythonIcon"
            class="w-5 h-5"
          ></div>
          <Package v-else class="w-5 h-5" />
          <span class="text-xs">{{ sdk.name }}</span>
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <a
          :href="activeSdk.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all"
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
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800',
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
      class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-800"
    >
      <div
        v-if="activeCodeHtml"
        v-html="activeCodeHtml"
        class="code-container"
      />
      <div
        v-else
        class="p-6 text-gray-500 dark:text-gray-400 bg-white dark:bg-neutral-900"
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
}

.code-container :deep(pre) {
  margin: 0;
  padding: 1.5rem;
}
</style>
