<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { Download, Apple, Monitor } from "@lucide/vue";
import { Button } from "@/components/ui/button";

interface DownloadOption {
	os: "windows" | "macos" | "linux";
	label: string;
	shortLabel: string;
	href: string;
}

const downloads: DownloadOption[] = [
	{
		os: "windows",
		label: "Download for Windows",
		shortLabel: "Windows",
		href: "https://github.com/nvisycom/studio/releases/latest/download/nvisy-studio-windows.exe",
	},
	{
		os: "macos",
		label: "Download for macOS",
		shortLabel: "macOS",
		href: "https://github.com/nvisycom/studio/releases/latest/download/nvisy-studio-macos.dmg",
	},
	{
		os: "linux",
		label: "Download for Linux",
		shortLabel: "Linux",
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

onMounted(() => {
	detectedOS.value = detectOS();
});

const primaryDownload = computed(() => {
	return downloads.find((d) => d.os === detectedOS.value) || downloads[0];
});

const otherDownloads = computed(() => {
	return downloads.filter((d) => d.os !== detectedOS.value);
});

const getIcon = (os: string) => {
	switch (os) {
		case "macos":
			return Apple;
		case "linux":
			return Monitor;
		default:
			return Monitor;
	}
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <!-- Primary download button -->
    <Button
      as="a"
      :href="primaryDownload.href"
      size="lg"
      variant="glow"
      class="min-w-[240px]"
    >
      <Download class="w-5 h-5" />
      {{ primaryDownload.label }}
    </Button>

    <!-- Other platforms -->
    <div class="flex items-center gap-3 text-sm">
      <span class="text-muted-foreground">Also available for</span>
      <div class="flex items-center gap-2">
        <a
          v-for="download in otherDownloads"
          :key="download.os"
          :href="download.href"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <component :is="getIcon(download.os)" class="w-4 h-4" />
          {{ download.shortLabel }}
        </a>
      </div>
    </div>
  </div>
</template>
