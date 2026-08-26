<script setup lang="ts">
import { Loader2, Play, Database } from "@lucide/vue";
import type { Component } from "vue";
import { Card } from "#console/components/ui/card";

/**
 * A compact stat strip at the top of the overview: workspace-level totals from
 * `useAnalytics` (pipeline detections and stored files). Totals only here — the full
 * per-status / per-kind / per-model breakdowns live on the analytics pages.
 */
const { t } = useI18n();
const { analytics, isLoading } = useAnalytics();

interface Stat {
	key: string;
	icon: Component;
	label: string;
	value: string;
	sub: string;
}

// Error rate is a fraction (0–1) that's omitted until a detection reaches a terminal
// state — so it's "no signal yet", not 0%.
const errorRateLabel = computed(() => {
	const rate = analytics.value?.detections.errorRate;
	return rate === undefined
		? t("overview.stats.detections.noErrorSignal")
		: t("overview.stats.detections.errorRate", {
				percent: (rate * 100).toFixed(1),
			});
});

const stats = computed<Stat[]>(() => {
	const a = analytics.value;
	if (!a) return [];
	return [
		{
			key: "detections",
			icon: Play,
			label: t("overview.stats.detections.label"),
			value: a.detections.total.toLocaleString(),
			sub: errorRateLabel.value,
		},
		{
			key: "storage",
			icon: Database,
			label: t("overview.stats.storage.label"),
			value: formatFileSize(a.storage.totalBytes),
			sub: t("overview.stats.storage.files", { count: a.storage.fileCount }),
		},
	];
});
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <template v-if="isLoading && !analytics">
      <Card
        v-for="i in 2"
        :key="i"
        class="flex h-[92px] items-center justify-center rounded-xl border-border/50 py-0"
      >
        <Loader2 :size="18" class="animate-spin text-muted-foreground/60" />
      </Card>
    </template>

    <template v-else>
      <Card
        v-for="stat in stats"
        :key="stat.key"
        class="flex flex-row items-center gap-4 rounded-xl border-border/50 px-5 py-4"
      >
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground"
        >
          <component :is="stat.icon" :size="18" :stroke-width="1.75" />
        </div>
        <div class="min-w-0">
          <p
            class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {{ stat.label }}
          </p>
          <p
            class="mt-0.5 text-2xl font-semibold leading-none tabular-nums text-foreground"
          >
            {{ stat.value }}
          </p>
          <p class="mt-1 truncate text-xs text-muted-foreground">
            {{ stat.sub }}
          </p>
        </div>
      </Card>
    </template>
  </div>
</template>
