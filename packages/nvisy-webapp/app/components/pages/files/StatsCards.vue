<script setup lang="ts">
import { HardDrive, Zap, Files } from "lucide-vue-next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
	totalSize: string;
	totalDocumentsSize: string;
	indexSize: string;
	totalDocuments: number;
	totalSegments: number;
	avgSegmentSize: string;
	avgResponseTime: number;
	p95ResponseTime: number;
	cacheHitRate: number;
}

defineProps<Props>();
</script>

<template>
  <div class="grid gap-6 grid-cols-3">
    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle>Storage Usage</CardTitle>
        <HardDrive class="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-medium">{{ totalSize }}</div>
        <p
          class="text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-1"
        >
          Files {{ totalDocumentsSize }} • Index {{ indexSize }}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle>Documents</CardTitle>
        <Files class="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-medium">{{ totalDocuments }}</div>
        <p
          class="text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-1"
        >
          {{ totalSegments.toLocaleString() }} Segments •
          {{ avgSegmentSize }} Avg
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-2"
      >
        <CardTitle>Performance</CardTitle>
        <Zap class="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-medium">{{ avgResponseTime }}ms</div>
        <p
          class="text-sm font-normal text-neutral-500 dark:text-neutral-400 mt-1"
        >
          p95 {{ p95ResponseTime }}ms • {{ cacheHitRate }}% Cache Hit
        </p>
      </CardContent>
    </Card>
  </div>
</template>
