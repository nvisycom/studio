<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
  screenshot: string;
  screenshotAlt: string;
}

interface Props {
  steps?: Step[];
}

const props = withDefaults(defineProps<Props>(), {
  steps: () => [
    {
      id: "upload",
      number: 1,
      title: "Upload Documents",
      description:
        "Securely upload your documents in any format - PDF, Word, Excel, PowerPoint, and more. Batch upload supported for enterprise workflows.",
      screenshot: "/screenshots/upload.png",
      screenshotAlt: "Upload documents interface"
    },
    {
      id: "analyze",
      number: 2,
      title: "AI Analysis",
      description:
        "Our advanced AI scans your documents to identify sensitive information like PII, PHI, financial data, and custom patterns you define.",
      screenshot: "/screenshots/analyze.png",
      screenshotAlt: "AI analysis interface"
    },
    {
      id: "review",
      number: 3,
      title: "Review & Approve",
      description:
        "Preview all identified sensitive content with confidence scores. Accept, reject, or modify redactions with our intuitive review interface.",
      screenshot: "/screenshots/review.png",
      screenshotAlt: "Review redactions interface"
    },
    {
      id: "download",
      number: 4,
      title: "Download Secure Files",
      description:
        "Get your redacted documents with full audit trails. Original formatting preserved, sensitive data permanently removed.",
      screenshot: "/screenshots/download.png",
      screenshotAlt: "Download secure files interface"
    },
  ],
});
</script>

<template>
  <Tabs default-value="upload" class="w-full">
    <!-- Tab Triggers as Stepper -->
    <TabsList class="grid w-full grid-cols-2 lg:grid-cols-4 gap-4 mb-12 bg-transparent h-auto p-0">
      <TabsTrigger
        v-for="step in steps"
        :key="step.id"
        :value="step.id"
        class="flex flex-col items-center text-center p-6 data-[state=active]:bg-transparent data-[state=active]:shadow-none border-0"
      >
        <!-- Step Number Circle -->
        <div class="relative z-10 mb-4">
          <div
            class="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 flex items-center justify-center text-base font-semibold text-gray-600 dark:text-neutral-300 transition-all duration-300 data-[state=active]:border-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:border-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black group-hover:scale-105"
          >
            {{ step.number }}
          </div>
        </div>

        <!-- Step Title -->
        <h3 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
          {{ step.title }}
        </h3>

        <!-- Step Description -->
        <p class="text-xs md:text-sm text-gray-600 dark:text-neutral-400 leading-relaxed">
          {{ step.description }}
        </p>
      </TabsTrigger>
    </TabsList>

    <!-- Tab Content - Screenshots -->
    <TabsContent
      v-for="step in steps"
      :key="`content-${step.id}`"
      :value="step.id"
      class="mt-0"
    >
      <div class="relative rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-2xl">
        <img
          :src="step.screenshot"
          :alt="step.screenshotAlt"
          class="w-full h-auto"
          loading="lazy"
        />
      </div>
    </TabsContent>
  </Tabs>
</template>
