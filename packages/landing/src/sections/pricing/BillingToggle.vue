<script setup lang="ts">
import { computed } from "vue";
import { usePricing } from "./usePricing";
import { pricingConfig } from "./pricing-data";

const { isYearly, toggleBilling } = usePricing();

const discountPercentage = computed(() =>
	Math.round(pricingConfig.yearlyDiscount * 100),
);
</script>

<template>
  <div class="text-center">
    <div
      class="relative inline-flex items-center bg-gray-100 dark:bg-neutral-800 rounded-full p-1.5"
    >
      <div
        class="absolute inset-y-1.5 left-1.5 bg-white dark:bg-black rounded-full transition-all duration-300 ease-in-out shadow-sm"
        :class="isYearly ? 'w-44 translate-x-32' : 'w-32 translate-x-0'"
      ></div>
      <button
        @click="toggleBilling"
        type="button"
        class="relative z-10 px-6 py-3 text-base font-medium rounded-full transition-all duration-300 w-32"
        :class="
          !isYearly
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
        "
      >
        Monthly
      </button>
      <button
        @click="toggleBilling"
        type="button"
        class="relative z-10 px-6 py-3 text-base font-medium rounded-full transition-all duration-300 w-44 flex items-center justify-center gap-2"
        :class="
          isYearly
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
        "
      >
        <span>Annual</span>
        <span
          class="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap"
          >Save&nbsp;{{ discountPercentage }}%</span
        >
      </button>
    </div>
  </div>
</template>
