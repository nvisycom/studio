<script setup lang="ts">
import { FileText, Upload, Search, TrendingUp, Users } from "lucide-vue-next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

definePageMeta({
	pageName: "Documents",
});

const stats = [
	{
		title: "Total Documents",
		value: "1,234",
		change: "+12%",
		icon: FileText,
		trend: "up",
	},
	{
		title: "Storage Used",
		value: "45.2 GB",
		change: "+8%",
		icon: Upload,
		trend: "up",
	},
	{
		title: "Processing",
		value: "23",
		change: "-5%",
		icon: Search,
		trend: "down",
	},
	{
		title: "Shared",
		value: "156",
		change: "+18%",
		icon: Users,
		trend: "up",
	},
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-4 pb-0">
    <div class="max-w-7xl mx-auto w-full">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight">Documents</h1>
        <p class="text-neutral-600 dark:text-neutral-400 mt-1">
          Manage and organize your documents
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card v-for="stat in stats" :key="stat.title">
          <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle class="text-sm font-medium">
              {{ stat.title }}
            </CardTitle>
            <component :is="stat.icon" class="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold">{{ stat.value }}</div>
            <p
              class="text-xs mt-1"
              :class="
                stat.trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              "
            >
              {{ stat.change }} from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- Quick Actions -->
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card class="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                <FileText :size="24" class="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle class="text-base">Browse Files</CardTitle>
                <CardDescription>View and manage all your documents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button as-child variant="ghost" class="w-full justify-start">
              <NuxtLink to="/documents/files">
                Go to Files →
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>

        <Card class="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Search :size="24" class="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle class="text-base">Studio</CardTitle>
                <CardDescription>Edit and annotate documents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button as-child variant="ghost" class="w-full justify-start">
              <NuxtLink to="/documents/studio">
                Open Studio →
              </NuxtLink>
            </Button>
          </CardContent>
        </Card>

        <Card class="hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader>
            <div class="flex items-center gap-3">
              <div class="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                <Upload :size="24" class="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle class="text-base">Upload New</CardTitle>
                <CardDescription>Add documents to your library</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" class="w-full justify-start">
              Upload Document →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
