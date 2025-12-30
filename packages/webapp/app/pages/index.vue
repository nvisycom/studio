<script setup lang="ts">
import {
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  ArrowRight,
  Upload,
  Sparkles,
  Clock,
  TrendingUp,
  CreditCard,
  Database,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

definePageMeta({
  pageCategory: "Overview",
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

// Quick stats
const stats = [
  {
    title: "Documents",
    value: "1,284",
    change: "+12%",
    trend: "up",
    icon: FileText,
  },
  {
    title: "AI Queries",
    value: "3,429",
    change: "+8%",
    trend: "up",
    icon: MessageSquare,
  },
  {
    title: "Team Members",
    value: "12",
    change: "+2",
    trend: "up",
    icon: Users,
  },
];

// Recent activity
const recentActivity = [
  {
    id: 1,
    action: "Document uploaded",
    item: "contract_final_v3.pdf",
    user: "John Doe",
    time: "2 hours ago",
  },
  {
    id: 2,
    action: "AI query",
    item: "Summarize Q4 report",
    user: "Jane Smith",
    time: "3 hours ago",
  },
  {
    id: 3,
    action: "Document edited",
    item: "employee_handbook.docx",
    user: "Bob Johnson",
    time: "5 hours ago",
  },
  {
    id: 4,
    action: "New member joined",
    item: "Alice Brown",
    user: "System",
    time: "1 day ago",
  },
];

// Quick actions
const quickActions = [
  {
    title: "Upload Files",
    description: "Add new files to your knowledge base",
    icon: Upload,
    href: "/knowledge/files",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Ask AI",
    description: "Query your documents with AI",
    icon: Sparkles,
    href: "/knowledge",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "View Analytics",
    description: "Monitor usage and performance",
    icon: BarChart3,
    href: "/analytics",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Team",
    description: "Invite and manage team members",
    icon: Users,
    href: "/team",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
  },
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Welcome Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-medium text-neutral-900 dark:text-white">
          Welcome back
        </h1>
        <p class="text-base font-light text-neutral-600 dark:text-neutral-400">
          Here's what's happening in your workspace
        </p>
      </div>

      <!-- Credits & Storage Cards -->
      <div class="grid gap-4 md:grid-cols-2 mb-6">
        <!-- Credits Card -->
        <Card>
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
              >Credits</CardTitle
            >
            <CreditCard class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium">
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
            <CardTitle
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
              >Storage</CardTitle
            >
            <Database class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-baseline justify-between">
                <div class="text-2xl font-medium">{{ storageUsed }} GB</div>
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

      <!-- Stats Grid -->
      <div class="grid gap-4 md:grid-cols-3 mb-8">
        <Card v-for="stat in stats" :key="stat.title">
          <CardHeader
            class="flex flex-row items-center justify-between space-y-0 pb-2"
          >
            <CardTitle
              class="text-sm font-medium text-neutral-600 dark:text-neutral-400"
            >
              {{ stat.title }}
            </CardTitle>
            <component :is="stat.icon" class="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-medium">{{ stat.value }}</div>
            <p
              class="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1"
            >
              <TrendingUp
                v-if="stat.trend === 'up'"
                class="h-3 w-3 text-green-500"
              />
              <span
                :class="
                  stat.trend === 'up'
                    ? 'text-green-600 dark:text-green-400'
                    : ''
                "
              >
                {{ stat.change }}
              </span>
              <span class="text-neutral-400">from last month</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content Grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Quick Actions -->
        <div class="lg:col-span-2">
          <h2 class="text-lg font-medium mb-4">Quick Actions</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <Card
              v-for="action in quickActions"
              :key="action.title"
              class="group cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              as-child
            >
              <NuxtLink :to="action.href">
                <CardHeader class="pb-2">
                  <div class="flex items-center gap-3">
                    <div class="p-2 rounded-lg" :class="action.bg">
                      <component
                        :is="action.icon"
                        class="h-5 w-5"
                        :class="action.color"
                      />
                    </div>
                    <div class="flex-1">
                      <CardTitle
                        class="text-base font-medium flex items-center gap-2"
                      >
                        {{ action.title }}
                        <ArrowRight
                          class="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                        />
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{{ action.description }}</CardDescription>
                </CardContent>
              </NuxtLink>
            </Card>
          </div>
        </div>

        <!-- Recent Activity -->
        <div>
          <h2 class="text-lg font-medium mb-4">Recent Activity</h2>
          <Card>
            <CardContent class="p-0">
              <div class="divide-y divide-neutral-200 dark:divide-neutral-800">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="p-4 flex items-start gap-3"
                >
                  <div
                    class="p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800"
                  >
                    <Clock class="h-3 w-3 text-neutral-500" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-sm font-medium text-neutral-900 dark:text-white"
                    >
                      {{ activity.action }}
                    </p>
                    <p
                      class="text-sm text-neutral-600 dark:text-neutral-400 truncate"
                    >
                      {{ activity.item }}
                    </p>
                    <p class="text-xs text-neutral-400 mt-1">
                      {{ activity.time }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
