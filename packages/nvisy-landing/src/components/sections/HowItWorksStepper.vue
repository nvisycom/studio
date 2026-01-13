<script setup lang="ts">
import { Upload, Cpu, FileCheck, Download } from "lucide-vue-next";
import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";

const steps = [
  {
    step: 1,
    title: "Upload",
    description:
      "Drag and drop any document - PDFs, images, scans. We handle them all.",
    icon: Upload,
  },
  {
    step: 2,
    title: "Process",
    description: "Our AI analyzes and extracts structured data in seconds.",
    icon: Cpu,
  },
  {
    step: 3,
    title: "Review",
    description: "Verify extractions with our intuitive review interface.",
    icon: FileCheck,
  },
  {
    step: 4,
    title: "Export",
    description: "Download as JSON, CSV, or integrate via API.",
    icon: Download,
  },
];
</script>

<template>
  <Stepper
    :default-value="1"
    orientation="horizontal"
    class="flex w-full items-start justify-center gap-2"
  >
    <StepperItem
      v-for="item in steps"
      :key="item.step"
      :step="item.step"
      class="relative flex w-full flex-col items-center justify-center"
    >
      <StepperTrigger>
        <StepperIndicator
          class="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 transition-all duration-300 group-data-[state=active]:bg-gradient-to-br group-data-[state=active]:from-blue-100 group-data-[state=active]:to-pink-100 group-data-[state=completed]:bg-gradient-to-br group-data-[state=completed]:from-blue-100 group-data-[state=completed]:to-pink-100 dark:bg-neutral-800 dark:group-data-[state=active]:from-blue-900/60 dark:group-data-[state=active]:to-pink-900/60 dark:group-data-[state=completed]:from-blue-900/60 dark:group-data-[state=completed]:to-pink-900/60"
        >
          <component
            :is="item.icon"
            class="h-7 w-7 text-black dark:text-white"
          />
        </StepperIndicator>
      </StepperTrigger>

      <StepperSeparator
        v-if="item.step !== steps[steps.length - 1]?.step"
        class="absolute left-[calc(50%+40px)] right-[calc(-50%+40px)] top-8 block h-0.5 shrink-0 rounded-full bg-neutral-200 group-data-[state=completed]:bg-gradient-to-r group-data-[state=completed]:from-blue-400 group-data-[state=completed]:to-pink-400 dark:bg-neutral-700"
      />

      <div class="mt-3 flex flex-col items-center text-center">
        <StepperTitle
          class="text-lg font-medium text-neutral-900 group-data-[state=active]:text-black dark:text-white dark:group-data-[state=active]:text-white"
        >
          {{ item.title }}
        </StepperTitle>
        <StepperDescription
          class="mt-1 max-w-[180px] text-sm font-normal leading-relaxed text-neutral-600 dark:text-neutral-400"
        >
          {{ item.description }}
        </StepperDescription>
      </div>
    </StepperItem>
  </Stepper>
</template>
