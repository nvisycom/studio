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
        <svg
          class="w-6 h-6 text-gray-900 dark:text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
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
        <svg
          class="w-6 h-6 text-gray-900 dark:text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
            clip-rule="evenodd"
          />
        </svg>
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
        <svg
          class="w-6 h-6 text-gray-900 dark:text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
      </div>
      <h4 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">50+</h4>
      <p class="text-sm text-gray-600 dark:text-neutral-400">File Formats</p>
    </div>
  </div>
</template>
