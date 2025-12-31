<script setup lang="ts">
import {
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  ArrowRight,
  Upload,
  Sparkles,
  TrendingUp,
  CreditCard,
  Database,
  BookOpen,
  Code2,
  ExternalLink,
  Rocket,
  MessagesSquare,
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

const { t } = useI18n();

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

// Quick actions - neutral colors
const quickActions = [
  {
    title: "Upload Files",
    description: "Add new files to your knowledge base",
    icon: Upload,
    href: "/files",
  },
  {
    title: "Ask AI",
    description: "Query your documents with AI",
    icon: Sparkles,
    href: "/knowledge",
  },
  {
    title: "View Analytics",
    description: "Monitor usage and performance",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Team",
    description: "Invite and manage team members",
    icon: Users,
    href: "/team",
  },
];

// Resources
const resources = [
  {
    title: t("overview.resources.documentation.title"),
    description: t("overview.resources.documentation.description"),
    icon: BookOpen,
    href: "https://docs.nvisy.com",
  },
  {
    title: t("overview.resources.apiReference.title"),
    description: t("overview.resources.apiReference.description"),
    icon: Code2,
    href: "https://docs.nvisy.com/api",
  },
  {
    title: t("overview.resources.quickStart.title"),
    description: t("overview.resources.quickStart.description"),
    icon: Rocket,
    href: "https://docs.nvisy.com/quickstart",
  },
  {
    title: t("overview.resources.support.title"),
    description: t("overview.resources.support.description"),
    icon: MessagesSquare,
    href: "https://nvisy.com/support",
  },
];
</script>

<template>
  <div>
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
                stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : ''
              "
            >
              {{ stat.change }}
            </span>
            <span class="text-neutral-400">from last month</span>
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h2 class="text-lg font-medium mb-4">Quick Actions</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          v-for="action in quickActions"
          :key="action.title"
          class="group cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          as-child
        >
          <NuxtLink :to="action.href">
            <CardHeader class="pb-2">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <component
                    :is="action.icon"
                    class="h-5 w-5 text-neutral-600 dark:text-neutral-400"
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
              <CardDescription class="font-light">{{
                action.description
              }}</CardDescription>
            </CardContent>
          </NuxtLink>
        </Card>
      </div>
    </div>

    <!-- Resources Section -->
    <div>
      <h2
        class="text-sm font-light tracking-wider uppercase text-neutral-400 dark:text-neutral-500 mb-4"
      >
        {{ t("overview.resources.sectionTitle") }}
      </h2>
      <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <a
          v-for="resource in resources"
          :key="resource.title"
          :href="resource.href"
          target="_blank"
          rel="noopener noreferrer"
          class="group block"
        >
          <Card
            class="h-full border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <CardContent class="p-4">
              <div class="flex items-center gap-3">
                <div
                  class="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex-shrink-0"
                >
                  <component
                    :is="resource.icon"
                    class="h-4 w-4 text-neutral-500 dark:text-neutral-400"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-1.5">
                    <span
                      class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >
                      {{ resource.title }}
                    </span>
                    <ExternalLink
                      class="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  </div>
</template>
