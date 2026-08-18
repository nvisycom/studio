<script setup lang="ts">
import { Download, Upload } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#console/components/ui/select";
import AnalyticsAreaChart from "#console/components/pages/analytics/AnalyticsAreaChartLazy.vue";
import { AREA_CHARTS } from "#console/components/pages/analytics/charts";

definePageMeta({
	pageCategory: "header.category.analytics",
});

const { t } = useI18n();

useHead({ title: t("analytics.ai.title") });

// Selected reporting period.
const dateRange = ref("7d");
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-6">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[180px] h-9">
            <SelectValue :placeholder="t('analytics.common.selectPeriod')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{{ t("analytics.common.period24h") }}</SelectItem>
            <SelectItem value="7d">{{ t("analytics.common.period7d") }}</SelectItem>
            <SelectItem value="30d">{{ t("analytics.common.period30d") }}</SelectItem>
            <SelectItem value="90d">{{ t("analytics.common.period90d") }}</SelectItem>
          </SelectContent>
        </Select>

        <div class="flex gap-2">
          <!-- Import/Export aren't wired to a backend yet; disable them with a
               tooltip rather than present buttons that silently do nothing. -->
          <Button variant="outline" disabled :title="t('common.comingSoon')">
            <Upload :size="16" class="mr-2" />
            {{ t("analytics.common.import") }}
          </Button>
          <Button variant="outline" disabled :title="t('common.comingSoon')">
            <Download :size="16" class="mr-2" />
            {{ t("analytics.common.export") }}
          </Button>
        </div>
      </div>

      <!-- AI Charts -->
      <div class="grid gap-4 md:grid-cols-2 mb-4">
        <!-- AI Usage Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">{{ t("analytics.ai.aiUsage.title") }}</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.ai.aiUsage.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.aiUsage" />
          </CardContent>
        </Card>

        <!-- VLM Cache Hits Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">{{ t("analytics.ai.cachePerformance.title") }}</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.ai.cachePerformance.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.vlmCache" />
          </CardContent>
        </Card>

        <!-- Error Rate Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">{{ t("analytics.ai.errorRate.title") }}</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.ai.errorRate.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.errorRate" />
          </CardContent>
        </Card>

        <!-- Response Time Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">{{ t("analytics.ai.responseTime.title") }}</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >{{ t("analytics.ai.responseTime.subtitle") }}</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="AREA_CHARTS.responseTime" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
