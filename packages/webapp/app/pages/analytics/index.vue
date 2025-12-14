<script setup lang="ts">
import { ref } from "vue";
import {
	Download,
	Upload,
	TrendingUp,
	DollarSign,
	Database,
	CreditCard,
} from "lucide-vue-next";
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
import { Progress } from "@/components/ui/progress";
import CreditsUsedChart from "~/components/charts/CreditsUsedChart.vue";
import StorageUsedChart from "~/components/charts/StorageUsedChart.vue";
import DocumentsUploadDownloadChart from "~/components/charts/DocumentsUploadDownloadChart.vue";
import DocumentsEditVerifyChart from "~/components/charts/DocumentsEditVerifyChart.vue";

definePageMeta({
	pageName: "Analytics",
});

// Date range for analytics
const dateRange = ref("7d");

// Check if on-premise deployment
const isOnPremise = ref(false); // TODO: Get this from config/environment

// Credits data
const creditsUsed = 15000;
const creditsTotal = 20000;
const creditsRemaining = creditsTotal - creditsUsed;
const creditsPercentage = (creditsUsed / creditsTotal) * 100;

// Storage data (in GB)
const storageUsed = 45.2;
const storageTotal = 100;
const storageRemaining = storageTotal - storageUsed;
const storagePercentage = (storageUsed / storageTotal) * 100;

function exportAnalytics() {
	console.log("Exporting analytics data for range:", dateRange.value);
	// TODO: Implement actual export functionality
}

function importAnalytics() {
	console.log("Importing analytics data");
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

      <!-- Stats Cards -->
      <div class="grid gap-4 md:grid-cols-2 mb-6">
        <!-- Credits Card -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"> Credits </CardTitle>
            <CreditCard class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-bold">
                  {{ creditsUsed.toLocaleString() }}
                </div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  of {{ creditsTotal.toLocaleString() }}
                </div>
              </div>
              <Progress :model-value="creditsPercentage" class="h-2" />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                {{ creditsRemaining.toLocaleString() }} credits remaining
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Storage Card -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle class="text-sm font-medium"> Storage </CardTitle>
            <Database class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-bold">{{ storageUsed }} GB</div>
                <div class="text-sm text-neutral-600 dark:text-neutral-400">
                  of {{ storageTotal }} GB
                </div>
              </div>
              <Progress :model-value="storagePercentage" class="h-2" />
              <p class="text-xs text-neutral-600 dark:text-neutral-400">
                {{ storageRemaining.toFixed(1) }} GB remaining
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Charts -->
      <div class="grid gap-4 md:grid-cols-2 mb-4">
        <!-- Credits Used Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Credit Consumption</CardTitle>
            <CardDescription
              >AI and platform credits used over time</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-4">
            <CreditsUsedChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Storage Used Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
            <CardDescription
              >Original and edited file storage consumption</CardDescription
            >
          </CardHeader>
          <CardContent class="pt-4">
            <StorageUsedChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Documents Uploaded/Downloaded Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Document Transfers</CardTitle>
            <CardDescription>Documents uploaded and downloaded</CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <DocumentsUploadDownloadChart :date-range="dateRange" />
          </CardContent>
        </Card>

        <!-- Documents Edited/Verified Chart -->
        <Card>
          <CardHeader>
            <CardTitle>Document Processing</CardTitle>
            <CardDescription>Documents edited and verified</CardDescription>
          </CardHeader>
          <CardContent class="pt-4">
            <DocumentsEditVerifyChart :date-range="dateRange" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
