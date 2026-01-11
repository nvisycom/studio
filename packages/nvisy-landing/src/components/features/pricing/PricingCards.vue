<script setup lang="ts">
import { plans } from "./pricing-data";
import { usePricing } from "./usePricing";
import { Check } from "lucide-vue-next";

const { basicPrice, professionalPrice, formatNumber } = usePricing();
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Pricing Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="bg-white dark:bg-black rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-neutral-300 dark:hover:border-neutral-600 flex flex-col"
      >
        <div class="text-center mb-8">
          <h3 class="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            {{ plan.name }}
          </h3>

          <!-- Price Display -->
          <div class="mb-6">
            <template v-if="plan.price === 'custom'">
              <span class="text-4xl font-bold text-neutral-900 dark:text-white"
                >Custom</span
              >
            </template>
            <template v-else>
              <span class="text-4xl font-bold text-neutral-900 dark:text-white">
                ${{ plan.id === "basic" ? basicPrice : professionalPrice }}
              </span>
              <span class="text-neutral-500 dark:text-neutral-400 ml-2"
                >/month</span
              >
            </template>
          </div>

          <p class="text-neutral-600 dark:text-neutral-300 mb-6">
            {{ plan.description }}
          </p>

          <!-- Pages included info -->
          <template v-if="plan.pagesIncluded">
            <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <div class="text-sm text-neutral-700 dark:text-neutral-300">
                <div class="font-medium mb-1">
                  {{ formatNumber(plan.pagesIncluded) }} pages/month
                </div>
                <div class="text-neutral-500 dark:text-neutral-400">
                  included in plan
                </div>
              </div>
            </div>
          </template>

          <!-- Enterprise Info -->
          <template v-else-if="plan.price === 'custom'">
            <div class="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <div class="text-sm text-neutral-700 dark:text-neutral-300">
                <div class="font-medium mb-1">Unlimited pages</div>
                <div class="text-neutral-500 dark:text-neutral-400">
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
            <span class="text-neutral-700 dark:text-neutral-300">{{
              feature
            }}</span>
          </li>
        </ul>

        <!-- CTA Button -->
        <button
          class="w-full font-medium py-3 px-6 rounded-lg transition-colors"
          :class="{
            'bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200':
              plan.buttonVariant === 'primary',
            'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700':
              plan.buttonVariant === 'outline',
            'border-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black':
              plan.buttonVariant === 'secondary',
          }"
        >
          {{ plan.buttonText }}
        </button>
      </div>
    </div>
  </div>
</template>
