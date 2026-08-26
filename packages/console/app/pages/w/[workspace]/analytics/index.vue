<script setup lang="ts">
import { Play, Database, Cpu, AlertTriangle, Timer } from "@lucide/vue";
import type { AreaChartSpec } from "#console/components/pages/analytics/charts";
import type { BreakdownRow } from "#console/components/pages/analytics/AnalyticsBreakdown.vue";
import DetectionActivityGrid from "#console/components/pages/analytics/DetectionActivityGrid.vue";
import AnalyticsBreakdown from "#console/components/pages/analytics/AnalyticsBreakdown.vue";
import AnalyticsAreaChart from "#console/components/pages/analytics/AnalyticsAreaChartLazy.vue";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "#console/components/ui/card";
import { HeaderSocket, SectionTabs } from "#console/components/layout/header";

definePageMeta({
	pageCategory: "header.category.analytics",
	hideCategory: true,
});

const { t } = useI18n();
const sectionTabs = useSectionTabs();
useHead({ title: () => t("analytics.overview.title") });

const { analytics, isLoading, timeSeries, isLoadingTimeSeries } =
	useAnalytics();

// ── KPI tiles: detection health + storage + usage, from the snapshot ────────
const kpis = computed(() => {
	const a = analytics.value;
	if (!a) return [];
	const errorRate =
		a.detections.errorRate === undefined
			? t("analytics.kpis.noSignal")
			: t("analytics.kpis.errorRate", {
					percent: (a.detections.errorRate * 100).toFixed(1),
				});
	const avg =
		a.detections.avgDurationMs === undefined
			? t("analytics.kpis.noSignal")
			: t("analytics.kpis.avgDuration", {
					duration: formatDurationMs(a.detections.avgDurationMs),
				});
	// p95 (tail latency) only when a detection has completed.
	const p95 =
		a.detections.p95DurationMs === undefined
			? null
			: t("analytics.kpis.p95Duration", {
					duration: formatDurationMs(a.detections.p95DurationMs),
				});
	return [
		{
			key: "detections",
			icon: Play,
			label: t("analytics.kpis.detections"),
			value: a.detections.total.toLocaleString(),
			sub: [errorRate, avg, p95].filter(Boolean).join(" · "),
		},
		{
			key: "storage",
			icon: Database,
			label: t("analytics.kpis.storage"),
			value: formatFileSize(a.storage.totalBytes),
			sub: t("analytics.kpis.files", { count: a.storage.fileCount }),
		},
		{
			key: "usage",
			icon: Cpu,
			label: t("analytics.kpis.usage"),
			value: t("analytics.kpis.tokens", {
				count: a.usage.totalTokens.toLocaleString(),
			}),
			sub: t("analytics.kpis.tokenSplit", {
				input: a.usage.inputTokens.toLocaleString(),
				output: a.usage.outputTokens.toLocaleString(),
			}),
		},
	];
});

// ── Trend charts: real daily time-series -> AreaChartSpec ───────────────────
// Duration is charted in seconds and error rate as a percentage, so the axes
// read naturally; days without a completed detection contribute 0.
const trendData = computed(() =>
	(timeSeries.value?.points ?? []).map((p) => ({
		date: new Date(p.date),
		// The SDK's day-entry count field is still named `runs`.
		detections: p.runs,
		tokens: p.totalTokens ?? 0,
		errorPct: (p.errorRate ?? 0) * 100,
		avgSeconds: (p.avgDurationMs ?? 0) / 1000,
	})),
);

function trendSpec(
	key: string,
	label: string,
	color: string,
	icon: typeof Play,
): AreaChartSpec {
	return { series: [{ key, label, color, icon }], data: trendData.value };
}

const detectionsTrend = computed(() =>
	trendSpec(
		"detections",
		t("analytics.trends.detections"),
		"var(--chart-1)",
		Play,
	),
);
const tokensTrend = computed(() =>
	trendSpec("tokens", t("analytics.trends.tokens"), "var(--chart-2)", Cpu),
);
const errorTrend = computed(() =>
	trendSpec(
		"errorPct",
		t("analytics.trends.errorRate"),
		"var(--chart-5)",
		AlertTriangle,
	),
);
const durationTrend = computed(() =>
	trendSpec(
		"avgSeconds",
		t("analytics.trends.avgDuration"),
		"var(--chart-3)",
		Timer,
	),
);

// ── Breakdown cards: detections-by-status, storage-by-kind, usage-by-model ──
function toRows<T>(
	items: T[],
	spec: {
		value: (i: T) => number;
		label: (i: T) => string;
		format: (i: T) => string;
		keyOf: (i: T) => string;
		sub?: (i: T) => string;
	},
): BreakdownRow[] {
	const total = items.reduce((s, i) => s + spec.value(i), 0);
	return items
		.filter((i) => spec.value(i) > 0)
		.map((i) => ({
			key: spec.keyOf(i),
			label: spec.label(i),
			value: spec.format(i),
			sub: spec.sub?.(i),
			fraction: total > 0 ? spec.value(i) / total : 0,
		}));
}

const detectionsByStatus = computed<BreakdownRow[]>(() =>
	toRows(analytics.value?.detections.byStatus ?? [], {
		value: (e) => e.count,
		label: (e) => t(`workflows.detections.detectionStatus.${e.status}`),
		format: (e) => e.count.toLocaleString(),
		keyOf: (e) => e.status,
	}),
);

const storageByKind = computed<BreakdownRow[]>(() =>
	toRows(analytics.value?.storage.byKind ?? [], {
		value: (e) => e.totalBytes,
		label: (e) => t(`files.kind.${e.kind}`),
		format: (e) => formatFileSize(e.totalBytes),
		keyOf: (e) => e.kind,
		sub: (e) => t("analytics.kpis.files", { count: e.fileCount }),
	}),
);

const usageByModel = computed<BreakdownRow[]>(() =>
	toRows(analytics.value?.usage.byModel ?? [], {
		value: (e) => e.totalTokens,
		label: (e) => e.model,
		format: (e) =>
			t("analytics.kpis.tokens", { count: e.totalTokens.toLocaleString() }),
		keyOf: (e) => e.model,
		sub: (e) =>
			t("analytics.kpis.tokenSplit", {
				input: e.inputTokens.toLocaleString(),
				output: e.outputTokens.toLocaleString(),
			}),
	}),
);
</script>

<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-4 pb-6">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <!-- Section tabs in the app-header socket. -->
      <HeaderSocket>
        <SectionTabs :tabs="sectionTabs.analytics.value" />
      </HeaderSocket>

      <!-- KPI tiles -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <template v-if="isLoading && !analytics">
          <Card
            v-for="i in 3"
            :key="i"
            class="flex h-[92px] items-center justify-center rounded-xl border-border/50 py-0"
          >
            <div
              class="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"
            />
          </Card>
        </template>
        <Card
          v-for="kpi in kpis"
          v-else
          :key="kpi.key"
          class="flex flex-row items-center gap-4 rounded-xl border-border/50 px-5 py-4"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-muted-foreground"
          >
            <component :is="kpi.icon" :size="18" :stroke-width="1.75" />
          </div>
          <div class="min-w-0">
            <p
              class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {{ kpi.label }}
            </p>
            <p
              class="mt-0.5 text-2xl font-semibold leading-none tabular-nums text-foreground"
            >
              {{ kpi.value }}
            </p>
            <p class="mt-1 truncate text-xs text-muted-foreground">
              {{ kpi.sub }}
            </p>
          </div>
        </Card>
      </div>

      <!-- Detection activity heatmap -->
      <DetectionActivityGrid
        :time-series="timeSeries"
        :is-loading="isLoadingTimeSeries"
      />

      <!-- Trend charts -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card class="rounded-xl border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">
              {{ t("analytics.trends.detectionsTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="detectionsTrend" />
          </CardContent>
        </Card>

        <Card class="rounded-xl border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">
              {{ t("analytics.trends.tokensTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="tokensTrend" />
          </CardContent>
        </Card>

        <Card class="rounded-xl border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">
              {{ t("analytics.trends.errorRateTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="errorTrend" />
          </CardContent>
        </Card>

        <Card class="rounded-xl border-border/50">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium">
              {{ t("analytics.trends.avgDurationTitle") }}
            </CardTitle>
          </CardHeader>
          <CardContent class="pt-2">
            <AnalyticsAreaChart :spec="durationTrend" />
          </CardContent>
        </Card>
      </div>

      <!-- Breakdowns -->
      <div class="grid gap-4 md:grid-cols-3">
        <AnalyticsBreakdown
          :title="t('analytics.breakdowns.detectionsByStatus')"
          :rows="detectionsByStatus"
          :empty-text="t('analytics.breakdowns.noDetections')"
        />
        <AnalyticsBreakdown
          :title="t('analytics.breakdowns.storageByKind')"
          :rows="storageByKind"
          :empty-text="t('analytics.breakdowns.noStorage')"
        />
        <AnalyticsBreakdown
          :title="t('analytics.breakdowns.usageByModel')"
          :rows="usageByModel"
          :empty-text="t('analytics.breakdowns.noUsage')"
        />
      </div>
    </div>
  </div>
</template>
