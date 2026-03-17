<script setup lang="ts">
import { ref, watch } from "vue";
import { Upload, FileSearch, FileCheck, ShieldCheck } from "lucide-vue-next";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const steps = [
	{
		step: 1,
		id: "upload",
		title: "Upload",
		description: "Upload any file — PDFs, images, audio, CSV, or JSON.",
		icon: Upload,
		image: "/screenshots/upload.png",
		imageAlt: "Upload files interface",
	},
	{
		step: 2,
		id: "detect",
		title: "Detect",
		description:
			"Our AI scans for PII, PHI, financial data, and 50+ sensitive entity types.",
		icon: FileSearch,
		image: "/screenshots/review.png",
		imageAlt: "Detect sensitive data interface",
	},
	{
		step: 3,
		id: "review",
		title: "Review",
		description:
			"Review detected entities, adjust redaction rules, and confirm before applying.",
		icon: FileCheck,
		image: "/screenshots/redact.png",
		imageAlt: "Review detected entities interface",
	},
	{
		step: 4,
		id: "redact",
		title: "Redact",
		description:
			"Download redacted files or integrate via API. Full audit trail included.",
		icon: ShieldCheck,
		image: "/screenshots/export.png",
		imageAlt: "Redacted output interface",
	},
];

const activeStep = ref(1);

const setActiveStep = (step: number) => {
	activeStep.value = step;
};

const currentImage = ref(steps[0]);

watch(activeStep, (newStep) => {
	currentImage.value = steps[newStep - 1];
});
</script>

<template>
  <div class="w-full">
    <!-- Stepper -->
    <div class="flex w-full items-start justify-center gap-2 mb-12">
      <div
        v-for="(item, index) in steps"
        :key="item.step"
        class="relative flex w-full flex-col items-center justify-center group"
        :data-state="
          activeStep >= item.step
            ? activeStep === item.step
              ? 'active'
              : 'completed'
            : 'inactive'
        "
      >
        <!-- Step Button -->
        <button
          @click="setActiveStep(item.step)"
          :aria-label="`Step ${item.step}: ${item.title}`"
          :aria-current="activeStep === item.step ? 'step' : undefined"
          class="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
        >
          <div
            :class="[
              'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
              activeStep >= item.step
                ? 'bg-accent'
                : 'bg-accent/50 hover:bg-accent',
            ]"
          >
            <component
              :is="item.icon"
              class="h-7 w-7 text-foreground"
              aria-hidden="true"
            />
          </div>
        </button>

        <!-- Separator -->
        <div
          v-if="index < steps.length - 1"
          :class="[
            'absolute left-[calc(50%+40px)] right-[calc(-50%+40px)] top-8 h-0.5 rounded-full transition-all duration-300',
            activeStep > item.step ? 'bg-foreground/30' : 'bg-border',
          ]"
        />

        <!-- Labels -->
        <div class="mt-3 flex flex-col items-center text-center">
          <span
            :class="[
              'text-lg font-medium transition-colors duration-300',
              activeStep === item.step
                ? 'text-foreground'
                : 'text-muted-foreground',
            ]"
          >
            {{ item.title }}
          </span>
          <span
            class="mt-1 max-w-[180px] text-sm font-normal leading-relaxed text-muted-foreground"
          >
            {{ item.description }}
          </span>
        </div>
      </div>
    </div>

    <!-- Screenshot -->
    <Transition name="fade" mode="out-in">
      <div
        :key="currentImage.id"
        class="relative rounded-2xl overflow-hidden border border-border shadow-2xl"
      >
        <AspectRatio :ratio="16 / 9">
          <img
            :src="currentImage.image"
            :alt="currentImage.imageAlt"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </AspectRatio>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
