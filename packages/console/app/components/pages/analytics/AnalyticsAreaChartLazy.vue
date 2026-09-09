<script setup lang="ts">
import type { AreaChartSpec } from "./charts";
import { defineAsyncComponent } from "vue";
import { Skeleton } from "#console/components/ui/skeleton";

/**
 * Lazy wrapper around {@link AnalyticsAreaChart}.
 *
 * The chart pulls in @unovis (+ the d3 tree) — a large dependency that, when
 * imported statically, blocks the whole analytics route from painting until it
 * has loaded (a multi-second blank page in dev, a heavy eager chunk in prod).
 * Loading it as a separate async chunk lets the page shell (toolbar, cards,
 * headers) render immediately while each chart streams in behind a skeleton.
 */
const AnalyticsAreaChart = defineAsyncComponent(
	() => import("./AnalyticsAreaChart.vue"),
);

/** `compact` shrinks the chart height for the smaller supporting cards. */
defineProps<{ spec: AreaChartSpec; compact?: boolean }>();
</script>

<template>
  <Suspense>
    <AnalyticsAreaChart :spec="spec" :compact="compact" />
    <template #fallback>
      <Skeleton :class="compact ? 'h-[150px] w-full' : 'h-[200px] w-full'" />
    </template>
  </Suspense>
</template>
