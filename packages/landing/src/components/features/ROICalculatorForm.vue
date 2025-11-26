<script setup lang="ts">
import { ref, computed } from "vue";
import { TrendingUp, Clock, Wallet, Users } from "lucide-vue-next";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const pagesPerMonth = ref([5000]);
const hourlyRate = ref([30]);
const isManual = ref<boolean>(true);

// Time per page based on method
const timePerPage = computed(() => {
	return isManual.value ? 3 : 1; // 3 min manual, 1 min automated non-AI
});

const currentMonthlyCost = computed(() => {
	const hours = (pagesPerMonth.value[0] * timePerPage.value) / 60;
	return Math.round(hours * hourlyRate.value[0]);
});

const nvisyCost = computed(() => {
	// $0.10 per page
	return Math.round(pagesPerMonth.value[0] * 0.1);
});

const monthlySavings = computed(() => {
	return currentMonthlyCost.value - nvisyCost.value;
});

const annualSavings = computed(() => {
	return monthlySavings.value * 12;
});

const timeSavings = computed(() => {
	const currentHours = (pagesPerMonth.value[0] * timePerPage.value) / 60;
	const nvisyHours = (pagesPerMonth.value[0] * 0.05) / 60; // Assume ~3 seconds per page with Nvisy
	return Math.round(currentHours - nvisyHours);
});

const roi = computed(() => {
	if (nvisyCost.value === 0) return 0;
	return Math.round((monthlySavings.value / nvisyCost.value) * 100);
});
</script>

<template>
  <div
    class="bg-white dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 md:p-8"
  >
    <div class="grid md:grid-cols-2 gap-8">
      <!-- Input Section -->
      <div class="space-y-6">
        <h3 class="text-xl font-medium text-neutral-900 dark:text-white mb-6">
          Your Current Process
        </h3>

        <div>
          <Label
            class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            Pages per month
          </Label>
          <Slider
            v-model="pagesPerMonth"
            :min="500"
            :max="10000"
            :step="500"
            class="w-full"
          />
          <div
            class="text-right text-sm text-neutral-600 dark:text-neutral-400 mt-1"
          >
            {{ pagesPerMonth[0].toLocaleString() }}
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <Label
              for="redaction-method"
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              {{ isManual ? "Manual Redaction" : "Automated Non-AI Solutions" }}
            </Label>
            <Switch
              id="redaction-method"
              :model-value="isManual"
              @update:model-value="(value: boolean) => (isManual = value)"
            />
          </div>
          <div
            class="text-right text-sm text-neutral-600 dark:text-neutral-400 mt-1"
          >
            {{ timePerPage }} min/page
          </div>
        </div>

        <div>
          <Label
            class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
          >
            Average hourly rate ($)
          </Label>
          <Slider
            v-model="hourlyRate"
            :min="30"
            :max="200"
            :step="10"
            class="w-full"
          />
          <div
            class="text-right text-sm text-neutral-600 dark:text-neutral-400 mt-1"
          >
            ${{ hourlyRate[0] }}/hour
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div class="space-y-4">
        <h3 class="text-xl font-medium text-neutral-900 dark:text-white mb-6">
          Your Potential Savings
        </h3>

        <div class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Wallet class="w-5 h-5 text-neutral-900 dark:text-white" />
            <span
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Monthly Savings</span
            >
          </div>
          <div class="text-3xl font-bold text-neutral-900 dark:text-white">
            ${{ monthlySavings.toLocaleString() }}
          </div>
        </div>

        <div class="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <Clock class="w-5 h-5 text-neutral-900 dark:text-white" />
            <span
              class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >Time Saved per Month</span
            >
          </div>
          <div class="text-3xl font-bold text-neutral-900 dark:text-white">
            {{ timeSavings }} hours
          </div>
        </div>

        <div
          class="bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 rounded-lg p-4 text-white dark:text-black"
        >
          <div class="flex items-center gap-2 mb-2">
            <Users class="w-5 h-5" />
            <span class="text-sm font-medium">ROI</span>
          </div>
          <div class="text-3xl font-bold">{{ roi }}%</div>
          <div class="text-sm opacity-90 mt-1">Return on Investment</div>
        </div>

        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <p
            class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed"
          >
            * Calculations are estimates based on industry averages. Actual
            savings may vary based on your specific use case and implementation.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
