<script setup lang="ts">
import { Check, Sparkles, Building2, ExternalLink } from "@lucide/vue";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { Button } from "#console/components/ui/button";
import { Badge } from "#console/components/ui/badge";
import { Switch } from "#console/components/ui/switch";

const { t } = useI18n();

useHead({ title: () => t("billing.title") });

definePageMeta({
	pageCategory: "header.category.billing",
	feature: "billing",
});

// Current plan
const currentPlan = ref("free");

// Plans data. Display strings are stored as i18n keys and resolved via t() in
// the template so the array stays declarative.
const plans = [
	{
		id: "free",
		nameKey: "billing.plans.free.name",
		price: 0,
		descriptionKey: "billing.plans.free.description",
		featureKeys: [
			"billing.plans.free.features.teamMembers",
			"billing.plans.free.features.documents",
			"billing.plans.free.features.storage",
			"billing.plans.free.features.analytics",
			"billing.plans.free.features.support",
		],
		ctaKey: "billing.plans.free.cta",
		popular: false,
	},
	{
		id: "pro",
		nameKey: "billing.plans.pro.name",
		price: 49,
		descriptionKey: "billing.plans.pro.description",
		featureKeys: [
			"billing.plans.pro.features.teamMembers",
			"billing.plans.pro.features.documents",
			"billing.plans.pro.features.storage",
			"billing.plans.pro.features.analytics",
			"billing.plans.pro.features.support",
			"billing.plans.pro.features.apiAccess",
			"billing.plans.pro.features.integrations",
		],
		ctaKey: "billing.plans.pro.cta",
		popular: true,
	},
	{
		id: "enterprise",
		nameKey: "billing.plans.enterprise.name",
		price: null,
		descriptionKey: "billing.plans.enterprise.description",
		featureKeys: [
			"billing.plans.enterprise.features.teamMembers",
			"billing.plans.enterprise.features.documents",
			"billing.plans.enterprise.features.storage",
			"billing.plans.enterprise.features.analytics",
			"billing.plans.enterprise.features.support",
			"billing.plans.enterprise.features.sso",
			"billing.plans.enterprise.features.contracts",
			"billing.plans.enterprise.features.sla",
		],
		ctaKey: "billing.plans.enterprise.cta",
		popular: false,
	},
];

// Add-ons data. Display strings are stored as i18n keys and resolved via t().
const addons = ref([
	{
		id: "webhooks",
		nameKey: "billing.addons.webhooks.name",
		descriptionKey: "billing.addons.webhooks.description",
		price: 19,
		enabled: false,
		alpha: false,
		docUrl: "https://docs.nvisy.com/webhooks",
		docLabelKey: "billing.addons.webhooks.docLabel",
	},
	{
		id: "ai-insights",
		nameKey: "billing.addons.aiInsights.name",
		descriptionKey: "billing.addons.aiInsights.description",
		price: 29,
		enabled: false,
		alpha: true,
		docUrl: "https://docs.nvisy.com/ai-insights",
		docLabelKey: "billing.addons.aiInsights.docLabel",
	},
	{
		id: "on-premise",
		nameKey: "billing.addons.onPremise.name",
		descriptionKey: "billing.addons.onPremise.description",
		price: 99,
		enabled: false,
		alpha: true,
		docUrl: "https://docs.nvisy.com/on-premise",
		docLabelKey: "billing.addons.onPremise.docLabel",
	},
]);

function selectPlan(planId: string) {
	if (planId === "enterprise") {
		// Open contact sales
		window.open("https://nvisy.com/contact", "_blank", "noopener,noreferrer");
	} else if (planId !== currentPlan.value) {
		// TODO: Handle plan upgrade/downgrade
	}
}

function toggleAddon(addonId: string) {
	const addon = addons.value.find((a) => a.id === addonId);
	if (addon) {
		addon.enabled = !addon.enabled;
		// TODO: Persist addon state
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-6xl mx-auto w-full">
      <!-- Plans Section -->
      <div class="mb-10">
        <div class="mb-6">
          <h2 class="text-sm font-medium text-foreground">
            {{ t("billing.headings.plansTitle") }}
          </h2>
          <p class="text-xs text-muted-foreground">
            {{ t("billing.headings.plansSubtitle") }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <Card
            v-for="plan in plans"
            :key="plan.id"
            class="relative flex flex-col border-border/50"
            :class="[
              plan.popular ? 'border-primary ring-1 ring-primary' : '',
              currentPlan === plan.id ? 'bg-muted/30' : '',
            ]"
          >
            <!-- Popular badge -->
            <Badge
              v-if="plan.popular"
              class="absolute -top-3 left-1/2 -translate-x-1/2"
            >
              <Sparkles :size="12" class="mr-1" />
              {{ t("billing.badges.mostPopular") }}
            </Badge>

            <CardHeader class="pb-4">
              <CardTitle class="text-sm font-medium">{{
                t(plan.nameKey)
              }}</CardTitle>
              <CardDescription class="text-xs text-muted-foreground">{{
                t(plan.descriptionKey)
              }}</CardDescription>
            </CardHeader>

            <CardContent class="flex-1">
              <!-- Price -->
              <div class="mb-4">
                <template v-if="plan.price !== null">
                  <span class="text-2xl font-medium text-foreground">
                    ${{ plan.price }}
                  </span>
                  <span class="text-sm text-muted-foreground">
                    {{ t("billing.price.perMonth") }}
                  </span>
                </template>
                <template v-else>
                  <span class="text-lg font-medium text-foreground">
                    {{ t("billing.price.custom") }}
                  </span>
                </template>
              </div>

              <!-- Features -->
              <ul class="space-y-2">
                <li
                  v-for="featureKey in plan.featureKeys"
                  :key="featureKey"
                  class="flex items-start gap-2 text-sm"
                >
                  <Check :size="14" class="text-green-500 mt-0.5 shrink-0" />
                  <span class="text-muted-foreground">{{ t(featureKey) }}</span>
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
                  {{ t("billing.cta.currentPlan") }}
                </template>
                <template v-else-if="plan.id === 'enterprise'">
                  <Building2 :size="16" class="mr-2" />
                  {{ t("billing.cta.contactSales") }}
                </template>
                <template v-else>
                  {{ t(plan.ctaKey) }}
                </template>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Add-ons Section -->
      <div>
        <div class="mb-6">
          <h2 class="text-sm font-medium text-foreground">
            {{ t("billing.headings.addonsTitle") }}
          </h2>
          <p class="text-xs text-muted-foreground">
            {{ t("billing.headings.addonsSubtitle") }}
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-3">
          <Card
            v-for="addon in addons"
            :key="addon.id"
            class="flex flex-col border-border/50"
            :class="addon.enabled ? 'border-primary bg-primary/5' : ''"
          >
            <CardHeader class="pb-2">
              <div class="flex items-center justify-between">
                <CardTitle class="text-sm font-medium flex items-center gap-2">
                  {{ t(addon.nameKey) }}
                  <Badge v-if="addon.alpha" variant="secondary" class="text-xs">
                    {{ t("billing.badges.alpha") }}
                  </Badge>
                </CardTitle>
                <Switch
                  :model-value="addon.enabled"
                  @update:model-value="toggleAddon(addon.id)"
                />
              </div>
              <CardDescription class="text-xs text-muted-foreground">
                {{ t(addon.descriptionKey) }}
              </CardDescription>
            </CardHeader>

            <CardContent class="flex-1 pt-0 pb-3">
              <div class="flex items-baseline gap-1">
                <span class="text-xl font-medium text-foreground">
                  ${{ addon.price }}
                </span>
                <span class="text-sm text-muted-foreground">
                  {{ t("billing.price.perMonth") }}
                </span>
              </div>
            </CardContent>

            <CardFooter class="pt-0">
              <div class="w-full">
                <div class="border-t border-border/50 pt-3">
                  <a
                    :href="addon.docUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    {{ t(addon.docLabelKey) }}
                    <ExternalLink :size="12" />
                  </a>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <!-- Footer note -->
      <div class="mt-8 text-center">
        <p class="text-xs text-muted-foreground">
          {{ t("billing.footer.stripeNote") }}
          <a
            href="https://nvisy.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline"
          >
            {{ t("billing.footer.pricingLink") }}
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
