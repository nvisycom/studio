<script setup lang="ts">
import {
  Upload,
  Sparkles,
  Users,
  BarChart3,
  ArrowRight,
  CreditCard,
  Database,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const { firstName } = useAccount();

// Usage data
const creditsUsed = 15000;
const creditsTotal = 20000;
const creditsRemaining = creditsTotal - creditsUsed;
const creditsPercentage = (creditsUsed / creditsTotal) * 100;

const storageUsed = 45.2;
const storageTotal = 100;
const storageRemaining = storageTotal - storageUsed;
const storagePercentage = (storageUsed / storageTotal) * 100;

// Quick actions
const quickActions = [
  {
    title: "Upload Files",
    description: "Add documents to your knowledge base",
    icon: Upload,
    href: "/files",
  },
  {
    title: "Ask AI",
    description: "Query your documents",
    icon: Sparkles,
    href: "/knowledge",
  },
  {
    title: "Manage Team",
    description: "Invite members",
    icon: Users,
    href: "/team",
  },
  {
    title: "View Analytics",
    description: "Monitor usage",
    icon: BarChart3,
    href: "/analytics",
  },
];
</script>

<template>
  <div class="max-w-4xl">
    <!-- Welcome Section -->
    <div class="mb-10">
      <h1
        class="text-4xl font-light text-neutral-800 dark:text-neutral-200 mb-3 tracking-tight"
      >
        Welcome back<span v-if="firstName">, {{ firstName }}</span
        >!
      </h1>
      <p class="text-lg font-light text-neutral-500 dark:text-neutral-400">
        Here's what's happening in your workspace
      </p>
    </div>

    <!-- Credits & Storage Cards -->
    <div class="grid gap-4 md:grid-cols-2 mb-8">
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

    <!-- Quick Actions -->
    <div>
      <h2
        class="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4"
      >
        Quick Actions
      </h2>
      <div class="space-y-2">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.title"
          :to="action.href"
          class="group flex items-center gap-4 p-4 -mx-4 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
        >
          <div
            class="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors"
          >
            <component
              :is="action.icon"
              class="h-5 w-5 text-neutral-600 dark:text-neutral-400"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-neutral-900 dark:text-white">
              {{ action.title }}
            </p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ action.description }}
            </p>
          </div>
          <ArrowRight
            class="h-5 w-5 text-neutral-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
          />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
