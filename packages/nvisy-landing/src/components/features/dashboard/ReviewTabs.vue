<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Eye, FileSearch, Download } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";

interface Screenshot {
	id: string;
	label: string;
	icon: FunctionalComponent;
	image: string;
	alt: string;
}

const screenshots: Screenshot[] = [
	{
		id: "upload",
		label: "Upload",
		icon: Upload,
		image: "/screenshots/upload.png",
		alt: "Upload documents interface",
	},
	{
		id: "review",
		label: "Review",
		icon: Eye,
		image: "/screenshots/review.png",
		alt: "Review extractions interface",
	},
	{
		id: "extract",
		label: "Extract",
		icon: FileSearch,
		image: "/screenshots/redact.png",
		alt: "Extraction results interface",
	},
	{
		id: "export",
		label: "Export",
		icon: Download,
		image: "/screenshots/export.png",
		alt: "Export documents interface",
	},
];
</script>

<template>
  <Tabs default-value="upload" class="w-full">
    <TabsList
      class="grid w-full max-w-3xl mx-auto grid-cols-2 lg:grid-cols-4 gap-3 mb-12 h-auto p-0 bg-white dark:bg-black rounded-lg"
    >
      <TabsTrigger
        v-for="(screenshot, index) in screenshots"
        :key="screenshot.id"
        :value="screenshot.id"
        :class="[
          'flex items-center justify-between lg:justify-start gap-3 px-4 py-4 text-base font-light relative',
          'border border-neutral-200 dark:border-neutral-700 lg:border lg:border-transparent rounded-xl transition-all duration-300',
          'hover:border-neutral-300 dark:hover:border-neutral-600 hover:shadow-lg lg:hover:shadow-none',
          'data-[state=active]:border-neutral-900 dark:data-[state=active]:border-white data-[state=active]:bg-neutral-50 dark:data-[state=active]:bg-neutral-900',
          'lg:data-[state=active]:bg-transparent lg:data-[state=active]:border-neutral-300 dark:lg:data-[state=active]:border-neutral-600',
          index < 3 &&
            'lg:after:content-[\'\'] lg:after:absolute lg:after:right-[-7.5px] lg:after:top-[20%] lg:after:bottom-[20%] lg:after:w-px lg:after:bg-neutral-200 dark:lg:after:bg-neutral-800',
        ]"
      >
        <div class="flex items-center gap-3">
          <component :is="screenshot.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ screenshot.label }}</span>
        </div>
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="screenshot in screenshots"
      :key="screenshot.id"
      :value="screenshot.id"
      class="mt-0"
    >
      <div
        class="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-2xl"
      >
        <img
          :src="screenshot.image"
          :alt="screenshot.alt"
          class="w-full h-auto"
          loading="lazy"
        />
      </div>
    </TabsContent>
  </Tabs>
</template>
