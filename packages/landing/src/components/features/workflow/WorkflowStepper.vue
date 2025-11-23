<script setup lang="ts">
import {
	Stepper,
	StepperDescription,
	StepperIndicator,
	StepperItem,
	StepperSeparator,
	StepperTitle,
	StepperTrigger,
} from "@/components/ui/stepper";
import { CheckCircle2, Clock, Maximize } from "lucide-vue-next";

export interface Step {
	number: number;
	title: string;
	description: string;
}

interface Props {
	steps?: Step[];
}

const props = withDefaults(defineProps<Props>(), {
	steps: () => [
		{
			number: 1,
			title: "Upload Documents",
			description:
				"Securely upload your documents in any format - PDF, Word, Excel, PowerPoint, and more. Batch upload supported for enterprise workflows.",
		},
		{
			number: 2,
			title: "AI Analysis",
			description:
				"Our advanced AI scans your documents to identify sensitive information like PII, PHI, financial data, and custom patterns you define.",
		},
		{
			number: 3,
			title: "Review & Approve",
			description:
				"Preview all identified sensitive content with confidence scores. Accept, reject, or modify redactions with our intuitive review interface.",
		},
		{
			number: 4,
			title: "Download Secure Files",
			description:
				"Get your redacted documents with full audit trails. Original formatting preserved, sensitive data permanently removed.",
		},
	],
});
</script>

<template>
  <div class="max-w-4xl mx-auto mb-16">
    <Stepper
      :default-value="1"
      class="flex flex-col lg:flex-row gap-8 lg:gap-4"
    >
      <StepperItem
        v-for="(step, index) in steps"
        :key="step.number"
        :step="step.number"
        class="relative flex-1 group"
      >
        <StepperTrigger class="flex flex-col items-center text-center w-full">
          <div class="relative z-10 mb-6">
            <StepperIndicator
              class="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 flex items-center justify-center text-base font-semibold text-gray-600 dark:text-neutral-300 transition-all duration-300 data-[state=active]:border-gray-900 data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:border-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black data-[state=completed]:border-gray-900 data-[state=completed]:bg-gray-900 data-[state=completed]:text-white dark:data-[state=completed]:border-white dark:data-[state=completed]:bg-white dark:data-[state=completed]:text-black group-hover:scale-105"
            >
              {{ step.number }}
            </StepperIndicator>
          </div>

          <StepperTitle
            class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300"
          >
            {{ step.title }}
          </StepperTitle>

          <StepperDescription
            class="text-gray-700 dark:text-neutral-300 text-sm leading-relaxed"
          >
            {{ step.description }}
          </StepperDescription>
        </StepperTrigger>

        <StepperSeparator
          v-if="index < steps.length - 1"
          class="hidden lg:block absolute top-6 left-[calc(50%+1.5rem)] w-[calc(100%-3rem)] h-0.5 bg-gray-300 dark:bg-neutral-600 data-[state=completed]:bg-gray-900 dark:data-[state=completed]:bg-white transition-colors duration-300"
        />
      </StepperItem>
    </Stepper>
  </div>

  <!-- Stats Section -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
    <div
      class="text-center p-6 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-700"
    >
      <div
        class="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <CheckCircle2 class="w-6 h-6 text-gray-900 dark:text-white" />
      </div>
      <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        99.9%
      </h4>
      <p class="text-sm text-gray-600 dark:text-neutral-400">Accuracy Rate</p>
    </div>

    <div
      class="text-center p-6 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-700"
    >
      <div
        class="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Clock class="w-6 h-6 text-gray-900 dark:text-white" />
      </div>
      <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        &lt;60s
      </h4>
      <p class="text-sm text-gray-600 dark:text-neutral-400">
        Average Processing
      </p>
    </div>

    <div
      class="text-center p-6 bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-700"
    >
      <div
        class="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <Maximize class="w-6 h-6 text-gray-900 dark:text-white" />
      </div>
      <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">12+</h4>
      <p class="text-sm text-gray-600 dark:text-neutral-400">File Formats</p>
    </div>
  </div>
</template>
