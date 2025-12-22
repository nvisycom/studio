<script setup lang="ts">
import { ref, computed } from "vue";
import {
	Upload,
	UserPlus,
	Plug,
	TrendingUp,
	TrendingDown,
	CheckCircle2,
	AlertCircle,
	Info,
	CreditCard,
	Database,
	FileText,
	Clock,
	Zap,
	Activity,
	Settings,
	Eye,
	EyeOff,
	Download,
	Calendar,
	ChevronRight,
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

definePageMeta({
	pageName: "Dashboard",
});

// Date range filter
const dateRange = ref("24h");

// Card visibility state
const cardVisibility = ref({
	verificationRate: true,
	documentsProcessed: true,
	documentsUploaded: true,
	documentsDownloaded: true,
	errorRate: true,
	responseTime: true,
	cachePerformance: true,
});

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

// Metrics with trends
const metrics = {
	verificationRate: { value: 94.5, trend: 2.3, unit: "%" },
	documentsProcessed: { value: 1247, trend: 12.5, unit: "" },
	documentsUploaded: { value: 342, trend: -5.2, unit: "" },
	documentsDownloaded: { value: 589, trend: 8.7, unit: "" },
	errorRate: { value: 0.8, trend: -15.3, unit: "%" },
	responseTime: { value: 245, trend: -8.2, unit: "ms" },
	cachePerformance: { value: 87.3, trend: 5.1, unit: "%" },
};

// Recent files
const recentFiles = [
	{
		id: "1",
		name: "contract_final_v3.pdf",
		size: "2.4 MB",
		uploadedAt: new Date("2024-01-20T10:30:00"),
		status: "verified",
	},
	{
		id: "2",
		name: "financial_report_2024.pdf",
		size: "1.8 MB",
		uploadedAt: new Date("2024-01-20T09:15:00"),
		status: "verified",
	},
	{
		id: "3",
		name: "legal_document.pdf",
		size: "3.2 MB",
		uploadedAt: new Date("2024-01-19T14:20:00"),
		status: "processing",
	},
	{
		id: "4",
		name: "employee_records.docx",
		size: "890 KB",
		uploadedAt: new Date("2024-01-19T11:45:00"),
		status: "verified",
	},
	{
		id: "5",
		name: "meeting_notes.txt",
		size: "45 KB",
		uploadedAt: new Date("2024-01-18T16:00:00"),
		status: "verified",
	},
];

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

function formatDate(date: Date): string {
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));

	if (hours < 1) return "Just now";
	if (hours < 24) return `${hours}h ago`;

	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
}

function getStatusColor(status: string) {
	switch (status) {
		case "verified":
			return "text-green-600 dark:text-green-400";
		case "processing":
			return "text-blue-600 dark:text-blue-400";
		case "failed":
			return "text-red-600 dark:text-red-400";
		default:
			return "text-neutral-600 dark:text-neutral-400";
	}
}

function toggleCardVisibility(key: string) {
	cardVisibility.value[key] = !cardVisibility.value[key];
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Top Bar with Date Range and Options -->
      <div class="flex items-center justify-end gap-2 mb-6">
        <Select v-model="dateRange">
          <SelectTrigger class="w-[150px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last hour</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Settings :size="16" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-64">
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.verificationRate"
              @update:checked="toggleCardVisibility('verificationRate')"
            >
              Verification Rate
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.documentsProcessed"
              @update:checked="toggleCardVisibility('documentsProcessed')"
            >
              Documents Processed
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.documentsUploaded"
              @update:checked="toggleCardVisibility('documentsUploaded')"
            >
              Documents Uploaded
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.documentsDownloaded"
              @update:checked="toggleCardVisibility('documentsDownloaded')"
            >
              Documents Downloaded
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.errorRate"
              @update:checked="toggleCardVisibility('errorRate')"
            >
              Error Rate
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.responseTime"
              @update:checked="toggleCardVisibility('responseTime')"
            >
              Response Time
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              :checked="cardVisibility.cachePerformance"
              @update:checked="toggleCardVisibility('cachePerformance')"
            >
              Cache Performance
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Top Stats Cards with Link to Billing -->
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
              <div class="flex items-center justify-between">
                <p class="text-xs text-neutral-600 dark:text-neutral-400">
                  {{ creditsRemaining.toLocaleString() }} credits remaining
                </p>
                <Button
                  as-child
                  variant="link"
                  class="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                >
                  <NuxtLink to="/billing">View Plan</NuxtLink>
                </Button>
              </div>
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
              <div class="flex items-center justify-between">
                <p class="text-xs text-neutral-600 dark:text-neutral-400">
                  {{ storageRemaining.toFixed(1) }} GB remaining
                </p>
                <Button
                  as-child
                  variant="link"
                  class="h-auto p-0 text-xs text-blue-600 dark:text-blue-400"
                >
                  <NuxtLink to="/billing">View Plan</NuxtLink>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Metrics Grid -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <!-- Verification Rate -->
        <Card v-if="cardVisibility.verificationRate">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">
              Verification Rate
            </CardTitle>
            <CheckCircle2 class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.verificationRate.value
              }}{{ metrics.verificationRate.unit }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.verificationRate.trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.verificationRate.trend >= 0
                    ? TrendingUp
                    : TrendingDown
                "
                :size="12"
              />
              {{ Math.abs(metrics.verificationRate.trend) }}% from last period
            </p>
          </CardContent>
        </Card>

        <!-- Documents Processed -->
        <Card v-if="cardVisibility.documentsProcessed">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium"> Processed </CardTitle>
            <Activity class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.documentsProcessed.value.toLocaleString() }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.documentsProcessed.trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.documentsProcessed.trend >= 0
                    ? TrendingUp
                    : TrendingDown
                "
                :size="12"
              />
              {{ Math.abs(metrics.documentsProcessed.trend) }}% from last period
            </p>
          </CardContent>
        </Card>

        <!-- Documents Uploaded -->
        <Card v-if="cardVisibility.documentsUploaded">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium"> Uploaded </CardTitle>
            <Upload class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.documentsUploaded.value.toLocaleString() }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.documentsUploaded.trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.documentsUploaded.trend >= 0
                    ? TrendingUp
                    : TrendingDown
                "
                :size="12"
              />
              {{ Math.abs(metrics.documentsUploaded.trend) }}% from last period
            </p>
          </CardContent>
        </Card>

        <!-- Documents Downloaded -->
        <Card v-if="cardVisibility.documentsDownloaded">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium"> Downloaded </CardTitle>
            <Download class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.documentsDownloaded.value.toLocaleString() }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.documentsDownloaded.trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.documentsDownloaded.trend >= 0
                    ? TrendingUp
                    : TrendingDown
                "
                :size="12"
              />
              {{ Math.abs(metrics.documentsDownloaded.trend) }}% from last
              period
            </p>
          </CardContent>
        </Card>

        <!-- Error Rate -->
        <Card v-if="cardVisibility.errorRate">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium"> Error Rate </CardTitle>
            <AlertCircle class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.errorRate.value }}{{ metrics.errorRate.unit }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.errorRate.trend <= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="metrics.errorRate.trend <= 0 ? TrendingDown : TrendingUp"
                :size="12"
              />
              {{ Math.abs(metrics.errorRate.trend) }}% from last period
            </p>
          </CardContent>
        </Card>

        <!-- Response Time -->
        <Card v-if="cardVisibility.responseTime">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium"> Response Time </CardTitle>
            <Clock class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.responseTime.value }}{{ metrics.responseTime.unit }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.responseTime.trend <= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.responseTime.trend <= 0 ? TrendingDown : TrendingUp
                "
                :size="12"
              />
              {{ Math.abs(metrics.responseTime.trend) }}% from last period
            </p>
          </CardContent>
        </Card>

        <!-- Cache Performance -->
        <Card v-if="cardVisibility.cachePerformance">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium">
              Cache Performance
            </CardTitle>
            <Zap class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">
              {{ metrics.cachePerformance.value
              }}{{ metrics.cachePerformance.unit }}
            </div>
            <p
              class="text-xs flex items-center gap-1 mt-1"
              :class="
                metrics.cachePerformance.trend >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              <component
                :is="
                  metrics.cachePerformance.trend >= 0
                    ? TrendingUp
                    : TrendingDown
                "
                :size="12"
              />
              {{ Math.abs(metrics.cachePerformance.trend) }}% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Main Layout: Left sidebar + Right content -->
      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <!-- Left Sidebar -->
        <div class="space-y-6">
          <!-- Quick Actions -->
          <div class="space-y-2">
            <Button
              as-child
              variant="outline"
              class="w-full justify-start h-auto py-3 px-4"
            >
              <NuxtLink to="/documents" class="flex items-center gap-3">
                <Upload :size="24" class="text-black dark:text-white" />
                <span class="font-medium">Upload Document</span>
              </NuxtLink>
            </Button>

            <Button
              as-child
              variant="outline"
              class="w-full justify-start h-auto py-3 px-4"
            >
              <NuxtLink to="/members" class="flex items-center gap-3">
                <UserPlus :size="24" class="text-black dark:text-white" />
                <span class="font-medium">Invite Members</span>
              </NuxtLink>
            </Button>

            <Button
              as-child
              variant="outline"
              class="w-full justify-start h-auto py-3 px-4"
            >
              <NuxtLink to="/integrations" class="flex items-center gap-3">
                <Plug :size="24" class="text-black dark:text-white" />
                <span class="font-medium">Connect Integration</span>
              </NuxtLink>
            </Button>
          </div>

          <!-- Recent Files -->
          <Card>
            <CardHeader class="pb-3">
              <div class="flex items-center justify-between">
                <div>
                  <CardTitle class="text-base">Recent Files</CardTitle>
                  <CardDescription class="text-xs"
                    >Recently modified</CardDescription
                  >
                </div>
                <Button as-child variant="link" size="sm" class="h-auto p-0">
                  <NuxtLink to="/documents" class="flex items-center gap-1">
                    View all
                    <ChevronRight :size="12" />
                  </NuxtLink>
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-3">
              <NuxtLink
                v-for="file in recentFiles"
                :key="file.id"
                to="/documents"
                class="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <FileText :size="16" class="mt-0.5 text-neutral-400" />
                <div class="flex-1 min-w-0">
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white truncate"
                  >
                    {{ file.name }}
                  </p>
                  <div
                    class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    <span>{{ file.size }}</span>
                    <span>•</span>
                    <span>{{ formatDate(file.uploadedAt) }}</span>
                  </div>
                </div>
                <component
                  :is="file.status === 'verified' ? CheckCircle2 : Clock"
                  :size="14"
                  :class="getStatusColor(file.status)"
                />
              </NuxtLink>
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
              <Button as-child variant="link" size="sm" class="h-auto p-0">
                <NuxtLink to="/analytics/logs" class="flex items-center gap-1">
                  View all
                  <ChevronRight :size="12" />
                </NuxtLink>
              </Button>
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
