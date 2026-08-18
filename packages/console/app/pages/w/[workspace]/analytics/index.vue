<script setup lang="ts">
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import AnalyticsToolbar from "#console/components/pages/analytics/AnalyticsToolbar.vue";
import AnalyticsAreaChart from "#console/components/pages/analytics/AnalyticsAreaChartLazy.vue";
import { AREA_CHARTS } from "#console/components/pages/analytics/charts";

definePageMeta({
	pageCategory: "header.category.analytics",
});

const { t } = useI18n();

useHead({ title: t("analytics.overview.title") });

// Selected reporting period.
const dateRange = ref("7d");
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Toolbar -->
      <AnalyticsToolbar v-model:period="dateRange" />

      <!-- Charts -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Credits Used Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >{{ t("analytics.overview.creditConsumption.title") }}</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.overview.creditConsumption.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.credits" />
          </CardContent>
        </Card>

        <!-- Storage Used Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">{{ t("analytics.overview.storageUsage.title") }}</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.overview.storageUsage.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.storage" />
          </CardContent>
        </Card>

        <!-- Documents Uploaded/Downloaded Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >{{ t("analytics.overview.documentTransfers.title") }}</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.overview.documentTransfers.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.uploadDownload" />
          </CardContent>
        </Card>

        <!-- Documents Edited/Verified Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >{{ t("analytics.overview.documentProcessing.title") }}</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.overview.documentProcessing.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.editVerify" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
