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
  <div
    class="bg-background rounded-xl p-6 h-[280px] relative border border-border/50"
  >
    <div class="space-y-6 relative overflow-hidden h-full">
      <TransitionGroup name="step">
        <div v-for="(step, index) in steps" :key="step.id" class="relative">
          <!-- Vertical line connector -->
          <div
            v-if="index < steps.length - 1"
            class="absolute left-5 w-px bg-border"
            style="top: 50px; bottom: -14px"
          />

          <!-- Top row: Icon, Badge, Date -->
          <div class="flex items-center gap-4 mb-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 bg-accent border border-border/50 transition-all duration-500"
              :class="{
                'bg-emerald-500/10 border-emerald-500/30':
                  step.status === 'completed',
                'bg-blue-500/10 border-blue-500/30': step.status === 'loading',
              }"
            >
              <Spinner
                v-if="step.status === 'loading'"
                class="w-5 h-5 text-blue-500"
              />
              <Check
                v-else-if="step.status === 'completed'"
                class="w-5 h-5 text-emerald-500"
              />
              <component
                v-else
                :is="step.icon"
                class="w-5 h-5 text-muted-foreground"
              />
            </div>
            <Badge
              :class="step.badgeColor"
              class="text-sm px-3 py-1 border transition-all duration-300"
            >
              {{ step.text }}
            </Badge>
            <div
              class="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground"
            >
              <Calendar class="w-3 h-3" />
              <span class="font-mono">{{ step.timestamp }}</span>
            </div>
          </div>

          <!-- Bottom section: Metadata in single line -->
          <div class="ml-14 text-xs text-foreground">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-muted-foreground">via</span>
              <Badge
                variant="secondary"
                class="text-xs bg-accent text-foreground border-border/50"
              >
                {{ step.service }}
              </Badge>
              <span
                v-if="step.status === 'completed'"
                class="contents animate-fade-in"
              >
                <span class="text-muted-foreground">• took</span>
                <Badge
                  variant="secondary"
                  class="text-xs bg-accent text-foreground border-border/50"
                >
                  {{ step.duration }}
                </Badge>
                <span class="text-muted-foreground">•</span>
                <Badge
                  variant="secondary"
                  class="text-xs bg-accent text-foreground border-border/50"
                >
                  {{ step.dataSize }}
                </Badge>
              </span>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <!-- Fade effect at the bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none z-10"
      />
    </div>
  </div>
</template>

<style scoped>
.step-enter-active,
.step-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.step-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.step-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease forwards;
}
</style>
