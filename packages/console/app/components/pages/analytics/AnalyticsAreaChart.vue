<script setup lang="ts">
import type { ChartConfig } from "#console/components/ui/chart";
import type { AreaChartSpec } from "./charts";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import {
	ChartContainer,
	ChartCrosshair,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	componentToString,
} from "#console/components/ui/chart";
import { formatShortDate } from "#console/utils/date";

const props = defineProps<{ spec: AreaChartSpec }>();

type Row = Record<string, number | Date>;

const series = computed(() => props.spec.series);

/** ChartConfig keyed by series key (plus an optional header label entry). */
const chartConfig = computed<ChartConfig>(() => {
	const config: ChartConfig = {};
	for (const s of series.value) {
		config[s.key] = { label: s.label, color: s.color, icon: s.icon };
	}
	return config;
});

/** One gradient per series, referenced as `url(#fill-<key>)` by the areas. */
const svgDefs = computed(() =>
	series.value
		.map(
			(s) => `
  <linearGradient id="fill-${s.key}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="${s.color}" stop-opacity="0.8" />
    <stop offset="95%" stop-color="${s.color}" stop-opacity="0.1" />
  </linearGradient>`,
		)
		.join(""),
);

const date = (d: Row) => d.date as Date;

/** Area bands: one accessor per series (raw value). */
const areaY = computed(() =>
	series.value.map((s) => (d: Row) => d[s.key] as number),
);
const areaColor = (_d: Row, i: number) =>
	`url(#fill-${series.value[i]?.key ?? ""})`;

/** Line bands: cumulatively stacked so multi-series areas read as a stack. */
const lineY = computed(() =>
	series.value.map((_s, i) => (d: Row) => {
		let sum = 0;
		for (let j = 0; j <= i; j++) sum += d[series.value[j]!.key] as number;
		return sum;
	}),
);
const lineColor = (_d: Row, i: number) => series.value[i]?.color ?? "";

const yDomain = computed<[number, number]>(() => {
	if (props.spec.yDomain) return props.spec.yDomain;
	const max = Math.max(
		...props.spec.data.map((d) =>
			series.value.reduce((sum, s) => sum + (d[s.key] as number), 0),
		),
	);
	return [0, max * 1.1];
});

const labelKey = computed(
	() => props.spec.labelKey ?? series.value[0]?.key ?? "",
);

const crosshair = computed(() =>
	componentToString(chartConfig.value, ChartTooltipContent, {
		indicator: "line",
		labelKey: labelKey.value,
		labelFormatter: (d) => formatShortDate(d as number),
	}),
);
</script>

<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full">
    <VisXYContainer
      :data="spec.data"
      :svg-defs="svgDefs"
      :margin="{ left: -40, top: 10, bottom: 10 }"
      :y-domain="yDomain"
    >
      <VisArea :x="date" :y="areaY" :color="areaColor" :opacity="0.6" />
      <VisLine :x="date" :y="lineY" :color="lineColor" :line-width="2" />
      <VisAxis
        type="x"
        :x="date"
        :tick-line="false"
        :domain-line="false"
        :grid-line="false"
        :num-ticks="6"
        :tick-format="(d: number) => formatShortDate(d)"
      />
      <VisAxis type="y" :num-ticks="3" :tick-line="false" :domain-line="false" />
      <ChartTooltip />
      <ChartCrosshair :template="crosshair" color="#0000" />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
