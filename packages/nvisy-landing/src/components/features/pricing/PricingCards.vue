<script setup lang="ts">
import { computed } from "vue";
import { plans, pricingConfig } from "./pricing-data";
import { usePricing } from "./usePricing";
import { Check, ArrowRight } from "lucide-vue-next";
import { Switch } from "@/components/ui/switch";
import type { PlanType } from "./pricing-data";

const { isYearly, setPricingPeriod } = usePricing();

const discountPercentage = computed(() =>
  Math.round(pricingConfig.yearlyDiscount * 100),
);

const showBillingToggle = (planId: string) => {
  return planId === "basic" || planId === "business";
};

// Computed prices that react to isYearly changes
const prices = computed(() => {
  const result: Record<string, number | "custom"> = {};
  for (const plan of plans) {
    if (plan.price === "custom") {
      result[plan.id] = "custom";
    } else {
      const basePrice = plan.price;
      const finalPrice = isYearly.value
        ? basePrice * (1 - pricingConfig.yearlyDiscount)
        : basePrice;
      result[plan.id] = Math.floor(finalPrice);
    }
  }
  return result;
});

const getPrice = (planId: PlanType) => prices.value[planId];
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Pricing Cards -->
    <div class="flex flex-col lg:flex-row max-w-6xl mx-auto items-stretch">
      <div
        v-for="(plan, index) in plans"
        :key="plan.id"
        class="relative group flex flex-col transition-all duration-300 flex-1"
        :class="[
          plan.popular
            ? 'bg-card border-2 border-foreground/20 shadow-xl p-8 lg:-my-4 lg:-mx-2 z-10 rounded-2xl'
            : [
                'bg-card/50 border border-border hover:border-border/80 hover:bg-card/80 p-6',
                index === 0 &&
                  'rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none',
                index === plans.length - 1 &&
                  'rounded-b-2xl lg:rounded-r-2xl lg:rounded-bl-none',
                index > 0 &&
                  !plan.popular &&
                  'border-t-0 lg:border-t lg:border-l-0',
              ],
        ]"
      >
        <!-- Popular badge -->
        <div
          v-if="plan.badge"
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-foreground text-background text-xs font-medium rounded-full"
        >
          {{ plan.badge }}
        </div>

        <!-- Plan header -->
        <div class="mb-5" :class="plan.popular ? 'mt-2' : ''">
          <h3 class="text-2xl font-normal mb-1">
            {{ plan.name }}
          </h3>
          <p class="text-sm text-foreground/70">
            {{ plan.description }}
          </p>
        </div>

        <!-- Price Display -->
        <div class="mb-5">
          <template v-if="getPrice(plan.id) === 'custom'">
            <span
              class="font-semibold"
              :class="plan.popular ? 'text-4xl' : 'text-3xl'"
              >Custom</span
            >
          </template>
          <template v-else-if="getPrice(plan.id) === 0">
            <span
              class="font-semibold"
              :class="plan.popular ? 'text-4xl' : 'text-3xl'"
              >Free</span
            >
          </template>
          <template v-else>
            <span
              class="font-semibold"
              :class="plan.popular ? 'text-4xl' : 'text-3xl'"
            >
              ${{ getPrice(plan.id) }}
            </span>
            <span class="text-foreground/60 ml-1 text-sm">/month</span>
          </template>
        </div>

        <!-- Billing Toggle for Basic/Business -->
        <div
          v-if="showBillingToggle(plan.id)"
          class="flex items-center gap-3 mb-5"
        >
          <Switch
            v-model:checked="isYearly"
            class="data-[state=checked]:bg-emerald-500"
          />
          <span class="text-sm text-foreground/70">
            Annual billing
            <span
              class="text-emerald-600 dark:text-emerald-400 font-medium ml-1"
            >
              -{{ discountPercentage }}%
            </span>
          </span>
        </div>

        <!-- Yearly billing note for Enterprise -->
        <div v-else-if="plan.id === 'enterprise'" class="mb-5">
          <span class="text-sm text-foreground/70">Billed annually</span>
        </div>

        <!-- Spacer for Free plan to align -->
        <div v-else class="mb-5 h-5"></div>

        <!-- Pages highlight -->
        <div class="bg-accent/50 rounded-xl p-4 mb-5 text-center">
          <div class="text-2xl font-semibold">{{ plan.pages }}</div>
          <div class="text-sm text-foreground/70">pages / month</div>
          <div class="text-xs text-foreground/50 mt-1">
            {{ plan.storage }} storage
          </div>
        </div>

        <!-- Features List -->
        <ul class="space-y-2.5 mb-6 flex-grow">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center gap-2.5"
          >
            <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span class="text-sm text-foreground/80">{{ feature }}</span>
          </li>
        </ul>

        <!-- CTA Button wrapper - aligned across all cards -->
        <div class="mt-auto">
          <button
            class="w-full font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            :class="[
              plan.popular
                ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm py-3 px-6'
                : 'bg-accent hover:bg-accent/80 text-foreground py-2.5 px-5',
            ]"
          >
            {{ plan.buttonText }}
            <ArrowRight class="w-4 h-4" />
          </button>

          <!-- Contact sales link (below button for Business only) -->
          <a
            v-if="plan.popular"
            href="/contact"
            class="block text-center mt-4 text-base leading-6 text-foreground/70 hover:text-foreground transition-colors"
          >
            or contact sales
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
