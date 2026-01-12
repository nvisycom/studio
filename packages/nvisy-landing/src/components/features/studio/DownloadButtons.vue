<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Download } from "lucide-vue-next";

interface DownloadOption {
	os: "windows" | "macos" | "linux";
	label: string;
	href: string;
}

const downloads: DownloadOption[] = [
	{
		os: "windows",
		label: "Windows",
		href: "https://github.com/nvisycom/studio/releases/latest/download/nvisy-studio-windows.exe",
	},
	{
		os: "macos",
		label: "macOS",
		href: "https://github.com/nvisycom/studio/releases/latest/download/nvisy-studio-macos.dmg",
	},
	{
		os: "linux",
		label: "Linux",
		href: "https://github.com/nvisycom/studio/releases/latest/download/nvisy-studio-linux.AppImage",
	},
];

const detectedOS = ref<"windows" | "macos" | "linux">("windows");

const detectOS = (): "windows" | "macos" | "linux" => {
	if (typeof navigator === "undefined") return "windows";

	const userAgent = navigator.userAgent.toLowerCase();
	const platform = (navigator.platform || "").toLowerCase();

	if (platform.includes("mac") || userAgent.includes("mac")) {
		return "macos";
	}
	if (platform.includes("linux") || userAgent.includes("linux")) {
		return "linux";
	}
	return "windows";
};

const sortedDownloads = ref<DownloadOption[]>(downloads);

onMounted(() => {
	detectedOS.value = detectOS();
	// Sort so detected OS is first
	sortedDownloads.value = [...downloads].sort((a, b) => {
		if (a.os === detectedOS.value) return -1;
		if (b.os === detectedOS.value) return 1;
		return 0;
	});
});
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3 justify-center">
    <a
      v-for="(download, index) in sortedDownloads"
      :key="download.os"
      :href="download.href"
      :class="[
        'inline-flex items-center justify-center gap-2 font-medium py-4 px-8 md:py-5 md:px-10 rounded-xl transition-all duration-200 text-base md:text-lg',
        index === 0
          ? 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200'
          : 'border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900',
      ]"
    >
      <Download class="w-5 h-5" />
      {{ download.label }}
    </a>
  </div>
</template>
