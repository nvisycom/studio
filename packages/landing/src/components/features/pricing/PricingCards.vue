<script setup lang="ts">
import { Slider } from "@/components/ui/slider";
import { plans } from "./pricing-data";
import { usePricing } from "./usePricing";
import { Check } from "lucide-vue-next";

const {
	basicPrice,
	professionalPrice,
	formatNumber,
	getRedactionCount,
	setRedactionCount,
	getSliderStep,
} = usePricing();
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-neutral-700 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-gray-300 dark:hover:border-neutral-600 flex flex-col"
      >
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {{ plan.name }}
          </h3>

          <!-- Price Display -->
          <div class="mb-6">
            <template v-if="plan.id === 'enterprise'">
              <span class="text-4xl font-bold text-gray-900 dark:text-white"
                >Custom</span
              >
            </template>
            <template v-else>
              <span class="text-4xl font-bold text-gray-900 dark:text-white">
                ${{ plan.id === "basic" ? basicPrice : professionalPrice }}
              </span>
              <span class="text-gray-500 dark:text-neutral-400 ml-2"
                >/month</span
              >
            </template>
          </div>

          <p class="text-gray-600 dark:text-neutral-300 mb-6">
            {{ plan.description }}
          </p>

          <!-- Redaction Slider -->
          <template
            v-if="plan.hasSlider && plan.minRedactions && plan.maxRedactions"
          >
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2"
              >
                Monthly Redactions:
                {{ formatNumber(getRedactionCount(plan.id)) }}
              </label>
              <Slider
                :model-value="[getRedactionCount(plan.id)]"
                @update:model-value="
                  (value) => setRedactionCount(plan.id, value?.[0] || 0)
                "
                :min="plan.minRedactions"
                :max="plan.maxRedactions"
                :step="getSliderStep(plan.id)"
                class="w-full"
              />
              <div
                class="flex justify-between text-xs text-gray-500 dark:text-neutral-400 mt-1"
              >
                <span>{{ formatNumber(plan.minRedactions) }}</span>
                <span>{{ formatNumber(plan.maxRedactions) }}</span>
              </div>
            </div>
          </template>

          <!-- Enterprise Info -->
          <template v-else-if="plan.id === 'enterprise'">
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <div class="text-sm text-gray-700 dark:text-neutral-300">
                <div class="font-medium mb-1">Unlimited Redactions</div>
                <div class="text-gray-500 dark:text-neutral-400">
                  Custom volume pricing available
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Features List -->
        <ul class="space-y-4 mb-8 flex-grow">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-3"
          >
            <Check class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span class="text-gray-700 dark:text-neutral-300">{{
              feature
            }}</span>
          </li>
        </ul>

        <!-- CTA Button -->
        <button
          class="w-full font-medium py-3 px-6 rounded-lg transition-colors"
          :class="{
            'bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-neutral-200':
              plan.buttonVariant === 'primary',
            'bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-neutral-700':
              plan.buttonVariant === 'outline',
            'border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black':
              plan.buttonVariant === 'secondary',
          }"
        >
          {{ plan.buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>
