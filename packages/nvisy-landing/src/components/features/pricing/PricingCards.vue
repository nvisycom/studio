<script setup lang="ts">
import { plans } from "./pricing-data";
import { Check, ArrowRight } from "lucide-vue-next";
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
            ? 'bg-card border-2 border-foreground/20 shadow-xl p-10 lg:-my-4 lg:-mx-2 z-10 rounded-2xl'
            : [
                'bg-card/50 border border-border hover:border-border/80 hover:bg-card/80 p-8',
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
        <div class="mb-6" :class="plan.popular ? 'mt-2' : ''">
          <h3 class="text-3xl font-semibold tracking-tight mb-2">
            {{ plan.name }}
          </h3>
          <p class="text-sm text-foreground/70">
            {{ plan.description }}
          </p>
        </div>

        <!-- Price Display -->
        <div class="mb-8">
          <template v-if="plan.priceUnit === 'custom'">
            <span class="text-4xl font-semibold">Custom</span>
          </template>
          <template v-else-if="plan.priceUnit === 'free'">
            <span class="text-4xl font-semibold">Free</span>
          </template>
          <template v-else>
            <span class="text-4xl font-semibold">
              ${{ plan.price }}
            </span>
            <span class="text-foreground/60 ml-1 text-sm">/month</span>
          </template>
        </div>

        <!-- Features List -->
        <ul class="space-y-3.5 mb-10 flex-grow">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-center gap-3"
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
                ? 'bg-foreground text-background hover:bg-foreground/90 shadow-sm py-3.5 px-6'
                : 'bg-accent hover:bg-accent/80 text-foreground py-3 px-5',
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
