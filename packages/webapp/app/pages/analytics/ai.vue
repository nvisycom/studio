<script setup lang="ts">
import { ref } from "vue";
import { Download, Upload } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AiUsageChart from "~/components/charts/AiUsageChart.vue";
import VlmCacheHitsChart from "~/components/charts/VlmCacheHitsChart.vue";
import ErrorRateChart from "~/components/charts/ErrorRateChart.vue";
import ResponseTimeChart from "~/components/charts/ResponseTimeChart.vue";

definePageMeta({
  pageName: "Analytics",
});

// Date range for analytics
const dateRange = ref("7d");

// Check if on-premise deployment
const isOnPremise = ref(false); // TODO: Get this from config/environment

function exportAnalytics() {
  console.log("Exporting AI analytics data for range:", dateRange.value);
  // TODO: Implement actual export functionality
}

function importAnalytics() {
  console.log("Importing AI analytics data");
  // TODO: Implement actual import functionality
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-6">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[180px]">
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
        <Card>
          <CardHeader>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription> OCR and VLM token consumption </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <AiUsageChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- VLM Cache Hits Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Cache Performance</CardTitle>
            <CardDescription> VLM cache hits and misses </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <VlmCacheHitsChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Error Rate Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Error Rate</CardTitle>
            <CardDescription>
              System errors as percentage of total requests
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <ErrorRateChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Response Time Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription> Average API response latency </CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <ResponseTimeChart :date-range="dateRange" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
