<script setup lang="ts">
import { ref } from "vue";
import { Check, Sparkles, Building2, ExternalLink } from "lucide-vue-next";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

definePageMeta({
	pageCategory: "Billing",
});

// Current plan
const currentPlan = ref("free");

// Plans data
const plans = [
	{
		id: "free",
		name: "Free",
		price: 0,
		description: "For individuals and small teams getting started",
		features: [
			"Up to 3 team members",
			"100 documents",
			"1 GB storage",
			"Basic analytics",
			"Community support",
		],
		cta: "Current Plan",
		popular: false,
	},
	{
		id: "pro",
		name: "Pro",
		price: 49,
		description: "For growing teams that need more power",
		features: [
			"Up to 20 team members",
			"Unlimited documents",
			"50 GB storage",
			"Advanced analytics",
			"Priority support",
			"API access",
			"Custom integrations",
		],
		cta: "Upgrade to Pro",
		popular: true,
	},
	{
		id: "enterprise",
		name: "Enterprise",
		price: null,
		description: "For large organizations with custom needs",
		features: [
			"Unlimited team members",
			"Unlimited documents",
			"Unlimited storage",
			"Enterprise analytics",
			"Dedicated support",
			"SSO & SAML",
			"Custom contracts",
			"SLA guarantees",
		],
		cta: "Contact Sales",
		popular: false,
	},
];

// Add-ons data
const addons = ref([
	{
		id: "webhooks",
		name: "Webhooks",
		description: "Real-time event notifications to your endpoints",
		price: 19,
		enabled: false,
		alpha: false,
		docUrl: "https://docs.nvisy.com/webhooks",
		docLabel: "Read webhooks docs",
	},
	{
		id: "ai-insights",
		name: "AI Insights",
		description: "Advanced AI-powered analytics and recommendations",
		price: 29,
		enabled: false,
		alpha: true,
		docUrl: "https://docs.nvisy.com/ai-insights",
		docLabel: "Read AI Insights docs",
	},
	{
		id: "on-premise",
		name: "On-Premise Runtimes",
		description: "Run processing on your own infrastructure",
		price: 99,
		enabled: false,
		alpha: true,
		docUrl: "https://docs.nvisy.com/on-premise",
		docLabel: "Read On-Premise docs",
	},
]);

function selectPlan(planId: string) {
	if (planId === "enterprise") {
		// Open contact sales
		window.open("https://nvisy.com/contact", "_blank");
	} else if (planId !== currentPlan.value) {
		// Handle plan upgrade/downgrade
		console.log("Switching to plan:", planId);
	}
}

function toggleAddon(addonId: string) {
	const addon = addons.value.find((a) => a.id === addonId);
	if (addon) {
		addon.enabled = !addon.enabled;
		console.log("Toggling addon:", addonId, addon.enabled);
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Plans Section -->
      <div class="mb-10">
        <div class="mb-6">
          <h2 class="text-xl font-medium text-neutral-900 dark:text-white">
            Plans
          </h2>
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
            Choose the plan that works best for your team
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <Card
            v-for="plan in plans"
            :key="plan.id"
            class="relative flex flex-col"
            :class="[
              plan.popular ? 'border-primary ring-1 ring-primary' : '',
              currentPlan === plan.id
                ? 'bg-neutral-50 dark:bg-neutral-900'
                : '',
            ]"
          >
            <!-- Popular badge -->
            <Badge
              v-if="plan.popular"
              class="absolute -top-3 left-1/2 -translate-x-1/2"
            >
              <Sparkles :size="12" class="mr-1" />
              Most Popular
            </Badge>

            <CardHeader>
              <CardTitle class="text-lg">{{ plan.name }}</CardTitle>
              <CardDescription>{{ plan.description }}</CardDescription>
            </CardHeader>

            <CardContent class="flex-1">
              <!-- Price -->
              <div class="mb-6">
                <template v-if="plan.price !== null">
                  <span
                    class="text-3xl font-medium text-neutral-900 dark:text-white"
                  >
                    ${{ plan.price }}
                  </span>
                  <span
                    class="text-sm font-light text-neutral-600 dark:text-neutral-400"
                  >
                    /month
                  </span>
                </template>
                <template v-else>
                  <span
                    class="text-xl font-medium text-neutral-900 dark:text-white"
                  >
                    Custom Pricing
                  </span>
                </template>
              </div>

              <!-- Features -->
              <ul class="space-y-3">
                <li
                  v-for="feature in plan.features"
                  :key="feature"
                  class="flex items-start gap-2 text-sm"
                >
                  <Check :size="16" class="text-green-500 mt-0.5 shrink-0" />
                  <span class="text-neutral-700 dark:text-neutral-300">{{
                    feature
                  }}</span>
                </li>
              </ul>
            </CardContent>

            <CardFooter>
              <Button
                class="w-full"
                :variant="
                  currentPlan === plan.id
                    ? 'outline'
                    : plan.popular
                      ? 'default'
                      : 'outline'
                "
                :disabled="currentPlan === plan.id"
                @click="selectPlan(plan.id)"
              >
                <template v-if="currentPlan === plan.id">
                  <Check :size="16" class="mr-2" />
                  Current Plan
                </template>
                <template v-else-if="plan.id === 'enterprise'">
                  <Building2 :size="16" class="mr-2" />
                  Contact Sales
                </template>
                <template v-else>
                  {{ plan.cta }}
                </template>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Add-ons Section -->
      <div>
        <div class="mb-6">
          <h2 class="text-xl font-medium text-neutral-900 dark:text-white">
            Add-ons
          </h2>
          <p class="text-sm font-light text-neutral-600 dark:text-neutral-400">
            Enhance your workspace with additional features
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <Card
            v-for="addon in addons"
            :key="addon.id"
            class="flex flex-col"
            :class="addon.enabled ? 'border-primary bg-primary/5' : ''"
          >
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <CardTitle class="text-lg font-light flex items-center gap-2">
                  {{ addon.name }}
                  <Badge v-if="addon.alpha" variant="secondary" class="text-xs">
                    ALPHA
                  </Badge>
                </CardTitle>
                <Switch
                  :checked="addon.enabled"
                  @update:checked="toggleAddon(addon.id)"
                />
              </div>
              <CardDescription>
                {{ addon.description }}
              </CardDescription>
            </CardHeader>

            <CardContent class="flex-1 pt-0 pb-3">
              <div class="flex items-baseline gap-1">
                <span
                  class="text-2xl font-medium text-neutral-900 dark:text-white"
                >
                  ${{ addon.price }}
                </span>
                <span
                  class="text-sm font-light text-neutral-600 dark:text-neutral-400"
                >
                  /month
                </span>
              </div>
            </CardContent>

            <CardFooter class="pt-0">
              <div class="w-full">
                <div
                  class="border-t border-neutral-200 dark:border-neutral-800 pt-3"
                >
                  <a
                    :href="addon.docUrl"
                    target="_blank"
                    class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {{ addon.docLabel }}
                    <ExternalLink :size="14" />
                  </a>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Footer note -->
      <div class="mt-8 text-center">
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          All payments are securely processed through Stripe.
          <a
            href="https://nvisy.com/pricing"
            target="_blank"
            class="text-primary hover:underline"
          >
            View full pricing details
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
