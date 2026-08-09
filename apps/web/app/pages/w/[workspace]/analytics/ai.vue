<script setup lang="ts">
import { Download, Upload } from "@lucide/vue";
import { Button } from "#console/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
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
import AiUsageChart from "#console/components/pages/analytics/AiUsageChart.vue";
import VlmCacheHitsChart from "#console/components/pages/analytics/VlmCacheHitsChart.vue";
import ErrorRateChart from "#console/components/pages/analytics/ErrorRateChart.vue";
import ResponseTimeChart from "#console/components/pages/analytics/ResponseTimeChart.vue";

useHead({ title: "AI Analytics" });

definePageMeta({
	pageCategory: "header.category.analytics",
});

// Date range for analytics
const dateRange = ref("7d");

// Check if on-premise deployment
const isOnPremise = ref(false); // TODO: Get this from config/environment

function exportAnalytics() {
	// TODO: Implement actual export functionality
}

function importAnalytics() {
	// TODO: Implement actual import functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-6">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[180px] h-9">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <div class="flex gap-2">
          <Button
            @click="importAnalytics"
            variant="outline"
            :disabled="!isOnPremise"
          >
            <Upload :size="16" class="mr-2" />
            Import
          </Button>
          <Button @click="exportAnalytics" variant="outline">
            <Download :size="16" class="mr-2" />
            Export
          </Button>
        </div>
      </div>

      <!-- AI Charts -->
      <div class="grid gap-4 md:grid-cols-2 mb-4">
        <!-- AI Usage Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">AI Usage</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >OCR and VLM token consumption</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <AiUsageChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- VLM Cache Hits Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Cache Performance</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >VLM cache hits and misses</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <VlmCacheHitsChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Error Rate Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Error Rate</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >System errors as percentage of total requests</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <ErrorRateChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Response Time Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Response Time</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >Average API response latency</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <ResponseTimeChart :date-range="dateRange" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
