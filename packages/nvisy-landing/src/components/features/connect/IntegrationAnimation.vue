<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Check, Calendar } from "lucide-vue-next";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { integrationSteps } from "./integrations";

interface Step {
	id: number;
	icon: any;
	text: string;
	service: string;
	badgeColor: string;
	status: "pending" | "loading" | "completed";
	duration: string;
	dataSize: string;
	timestamp: string;
}

const formatTime = () => {
	const now = new Date();
	const month = now.toLocaleString("en-US", { month: "short" });
	const day = now.getDate();
	const time = now.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	return `${month} ${day} ${time}`;
};

const steps = ref(
	integrationSteps.map((step) => ({
		...step,
		status: "pending" as const,
		timestamp: formatTime(),
	})),
);

let interval: number | null = null;

const runAnimation = () => {
	let currentStep = 0;

	interval = window.setInterval(() => {
		if (currentStep < steps.value.length) {
			// Update timestamp and mark as loading
			steps.value[currentStep].timestamp = formatTime();
			steps.value[currentStep].status = "loading";

			// After 800ms, mark as completed and move to next
			setTimeout(() => {
				if (currentStep < steps.value.length) {
					steps.value[currentStep].status = "completed";
					currentStep++;

					// If all steps completed, show spinner on all then reset
					if (currentStep === steps.value.length) {
						setTimeout(() => {
							// Set all steps to loading for spinner effect
							steps.value.forEach((step) => (step.status = "loading"));

							setTimeout(() => {
								// Reset all after spinner
								steps.value.forEach((step) => (step.status = "pending"));
								currentStep = 0;
							}, 800);
						}, 1200);
					}
				}
			}, 800);
		}
	}, 1300);
};

onMounted(() => {
	runAnimation();
});

onUnmounted(() => {
	if (interval) clearInterval(interval);
});
</script>

<template>
  <div class="bg-white dark:bg-black rounded-lg p-6 h-[280px] relative">
    <div class="space-y-6 relative overflow-hidden h-full">
      <div v-for="(step, index) in steps" :key="step.id" class="relative">
        <!-- Vertical line connector -->
        <div
          v-if="index < steps.length - 1"
          class="absolute left-5 w-px bg-neutral-300 dark:bg-neutral-700"
          style="top: 50px; bottom: -14px"
        />

        <!-- Top row: Icon, Badge, Date -->
        <div class="flex items-center gap-4 mb-4">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-neutral-100 dark:bg-neutral-900 transition-all duration-300"
          >
            <Spinner
              v-if="step.status === 'loading'"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
            <Check
              v-else-if="step.status === 'completed'"
              class="w-5 h-5 text-green-600 dark:text-green-400"
            />
            <component
              v-else
              :is="step.icon"
              class="w-5 h-5 text-neutral-600 dark:text-neutral-300"
            />
          </div>
          <Badge
            :class="step.badgeColor"
            class="text-sm font-light px-3 py-1 border"
          >
            {{ step.text }}
          </Badge>
          <div
            class="flex items-center gap-1 ml-auto text-xs font-light text-neutral-600 dark:text-neutral-400"
          >
            <Calendar class="w-3 h-3" />
            {{ step.timestamp }}
          </div>
        </div>

        <!-- Bottom section: Metadata in single line -->
        <div class="ml-14 text-xs font-light text-neutral-900 dark:text-white">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span>via</span>
            <Badge
              class="text-xs font-light bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
            >
              {{ step.service }}
            </Badge>
            <template v-if="step.status === 'completed'">
              <span>• took</span>
              <Badge
                class="text-xs font-light bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
              >
                {{ step.duration }}
              </Badge>
              <span>•</span>
              <Badge
                class="text-xs font-light bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-300 dark:border-neutral-700"
              >
                {{ step.dataSize }}
              </Badge>
            </template>
          </div>
        </div>
      </div>

      <!-- Fade effect at the bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-black to-transparent pointer-events-none z-10"
      />
    </div>
  </div>
</template>
