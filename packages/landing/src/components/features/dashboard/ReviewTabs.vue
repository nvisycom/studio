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
    alt: "Review redactions interface",
  },
  {
    id: "redact",
    label: "Redact",
    icon: FileSearch,
    image: "/screenshots/redact.png",
    alt: "Redaction results interface",
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
          'flex items-center justify-start gap-3 px-4 py-4 text-base font-light relative',
          index !== screenshots.length - 1 &&
            'after:content-[\'\'] after:absolute after:-right-1.5 after:top-[20%] after:bottom-[20%] after:w-px after:bg-gray-200 dark:after:bg-neutral-800',
        ]"
      >
        <component :is="screenshot.icon" class="w-5 h-5 flex-shrink-0" />
        <span>{{ screenshot.label }}</span>
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="screenshot in screenshots"
      :key="screenshot.id"
      :value="screenshot.id"
      class="mt-0"
    >
      <div
        class="relative rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-2xl"
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
