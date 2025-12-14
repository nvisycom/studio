<script setup lang="ts">
import {
	Upload,
	UserPlus,
	Plug,
	TrendingUp,
	HardDrive,
	Clock,
	CheckCircle2,
	AlertCircle,
	Info,
	ArrowUpRight,
} from "lucide-vue-next";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

definePageMeta({
	pageName: "Dashboard",
});

// Usage data
const usageData = {
	credits: {
		used: 8450,
		limit: 10000,
		percentage: 84.5,
	},
	storage: {
		used: 24.8,
		limit: 100,
		percentage: 24.8,
		unit: "GB",
	},
};

// Recent activity
const recentActivity = [
	{
		id: 1,
		type: "success",
		title: "Document redaction completed",
		description: "contract_final_v3.pdf was successfully redacted",
		time: "2 minutes ago",
	},
	{
		id: 2,
		type: "success",
		title: "Batch processing finished",
		description: "15 documents processed successfully",
		time: "15 minutes ago",
	},
	{
		id: 3,
		type: "warning",
		title: "Manual review required",
		description: "legal_document.pdf contains sensitive data requiring review",
		time: "1 hour ago",
	},
	{
		id: 4,
		type: "info",
		title: "New member joined",
		description: "alice@example.com accepted the team invitation",
		time: "3 hours ago",
	},
	{
		id: 5,
		type: "success",
		title: "Integration connected",
		description: "Dropbox integration successfully configured",
		time: "5 hours ago",
	},
	{
		id: 6,
		type: "success",
		title: "Document verified",
		description: "employee_records.pdf passed all verification checks",
		time: "6 hours ago",
	},
	{
		id: 7,
		type: "info",
		title: "Settings updated",
		description: "Privacy settings have been updated",
		time: "8 hours ago",
	},
	{
		id: 8,
		type: "success",
		title: "Export completed",
		description: "Monthly report exported successfully",
		time: "10 hours ago",
	},
];

function getActivityIcon(type: string) {
	switch (type) {
		case "success":
			return CheckCircle2;
		case "warning":
			return AlertCircle;
		case "info":
			return Info;
		default:
			return Info;
	}
}

function getActivityColor(type: string) {
	switch (type) {
		case "success":
			return "text-green-600 dark:text-green-400";
		case "warning":
			return "text-yellow-600 dark:text-yellow-400";
		case "info":
			return "text-blue-600 dark:text-blue-400";
		default:
			return "text-neutral-600 dark:text-neutral-400";
	}
}

function getActivityBgColor(type: string) {
	switch (type) {
		case "success":
			return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
		case "warning":
			return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
		case "info":
			return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
		default:
			return "bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800";
	}
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Main Layout: Left sidebar + Right content -->
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <!-- Left Sidebar -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Quick Actions</CardTitle>
              <CardDescription class="text-xs">Common tasks</CardDescription>
            </CardHeader>
            <CardContent class="space-y-2">
              <Button
                variant="outline"
                class="w-full justify-start gap-3 h-auto py-3"
              >
                <div
                  class="p-2 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                >
                  <Upload :size="18" />
                </div>
                <div class="text-left">
                  <div class="font-medium text-sm">Upload Document</div>
                  <div class="text-xs text-neutral-500 dark:text-neutral-400">
                    Start redaction
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                class="w-full justify-start gap-3 h-auto py-3"
              >
                <div
                  class="p-2 rounded-md bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                >
                  <UserPlus :size="18" />
                </div>
                <div class="text-left">
                  <div class="font-medium text-sm">Invite Members</div>
                  <div class="text-xs text-neutral-500 dark:text-neutral-400">
                    Add to workspace
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                class="w-full justify-start gap-3 h-auto py-3"
              >
                <div
                  class="p-2 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400"
                >
                  <Plug :size="18" />
                </div>
                <div class="text-left">
                  <div class="font-medium text-sm">Connect Integration</div>
                  <div class="text-xs text-neutral-500 dark:text-neutral-400">
                    Link your tools
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <!-- Usage Stats -->
          <Card>
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Usage</CardTitle>
              <CardDescription class="text-xs">Current period</CardDescription>
            </CardHeader>
            <CardContent class="space-y-5">
              <!-- Credits Usage -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                      <TrendingUp
                        class="h-3.5 w-3.5 text-blue-600 dark:text-blue-400"
                      />
                    </div>
                    <span
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                      >Credits</span
                    >
                  </div>
                  <span
                    class="text-xs font-semibold text-neutral-900 dark:text-white"
                  >
                    {{ usageData.credits.percentage }}%
                  </span>
                </div>
                <Progress
                  :model-value="usageData.credits.percentage"
                  class="h-1.5"
                />
                <div class="flex items-center justify-between text-xs">
                  <span class="text-neutral-600 dark:text-neutral-400">
                    {{ usageData.credits.used.toLocaleString() }} /
                    {{ usageData.credits.limit.toLocaleString() }}
                  </span>
                  <Button
                    variant="link"
                    class="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                  >
                    Upgrade <ArrowUpRight :size="12" class="ml-0.5" />
                  </Button>
                </div>
              </div>

              <div
                class="border-t border-neutral-200 dark:border-neutral-800"
              />

              <!-- Storage Usage -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div
                      class="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950"
                    >
                      <HardDrive
                        class="h-3.5 w-3.5 text-purple-600 dark:text-purple-400"
                      />
                    </div>
                    <span
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                      >Storage</span
                    >
                  </div>
                  <span
                    class="text-xs font-semibold text-neutral-900 dark:text-white"
                  >
                    {{ usageData.storage.percentage }}%
                  </span>
                </div>
                <Progress
                  :model-value="usageData.storage.percentage"
                  class="h-1.5"
                />
                <div class="flex items-center justify-between text-xs">
                  <span class="text-neutral-600 dark:text-neutral-400">
                    {{ usageData.storage.used }} / {{ usageData.storage.limit }}
                    {{ usageData.storage.unit }}
                  </span>
                  <Button
                    variant="link"
                    class="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                  >
                    Manage <ArrowUpRight :size="12" class="ml-0.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Right Content - Recent Activity -->
        <Card class="h-fit">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle class="text-lg">Recent Activity</CardTitle>
                <CardDescription
                  >Latest events across your workspace</CardDescription
                >
              </div>
              <Button variant="outline" size="sm"> View All </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="activity in recentActivity"
                :key="activity.id"
                class="flex items-start gap-4 p-4 rounded-lg border transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                :class="getActivityBgColor(activity.type)"
              >
                <div
                  class="p-2 rounded-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800"
                >
                  <component
                    :is="getActivityIcon(activity.type)"
                    :size="18"
                    :class="getActivityColor(activity.type)"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-semibold text-neutral-900 dark:text-white mb-1"
                  >
                    {{ activity.title }}
                  </p>
                  <p
                    class="text-sm text-neutral-600 dark:text-neutral-400 mb-2"
                  >
                    {{ activity.description }}
                  </p>
                  <div class="flex items-center gap-2">
                    <Clock
                      :size="12"
                      class="text-neutral-500 dark:text-neutral-500"
                    />
                    <span
                      class="text-xs text-neutral-500 dark:text-neutral-500"
                    >
                      {{ activity.time }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
