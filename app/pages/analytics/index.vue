<script setup lang="ts">
import { ref } from "vue";
import { Download, Upload } from "@lucide/vue";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import CreditsUsedChart from "~/components/pages/analytics/CreditsUsedChart.vue";
import StorageUsedChart from "~/components/pages/analytics/StorageUsedChart.vue";
import DocumentsUploadDownloadChart from "~/components/pages/analytics/DocumentsUploadDownloadChart.vue";
import DocumentsEditVerifyChart from "~/components/pages/analytics/DocumentsEditVerifyChart.vue";

useHead({ title: "Analytics" });

definePageMeta({
	pageCategory: "Analytics",
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

      <!-- Charts -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Credits Used Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >Credit Consumption</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >AI and platform credits used over time</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <CreditsUsedChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Storage Used Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">Storage Usage</CardTitle>
            <CardDescription class="text-xs text-muted-foreground"
              >Original and edited file storage consumption</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <StorageUsedChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Documents Uploaded/Downloaded Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >Document Transfers</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >Documents uploaded and downloaded</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <DocumentsUploadDownloadChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Documents Edited/Verified Chart -->
        <Card class="border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium"
              >Document Processing</CardTitle
            >
            <CardDescription class="text-xs text-muted-foreground"
              >Documents edited and verified</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-2">
            <DocumentsEditVerifyChart :date-range="dateRange" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
