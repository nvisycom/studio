<script setup lang="ts">
import type { ChartConfig } from "#console/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { CheckCircle, XCircle } from "@lucide/vue";
import {
	ChartContainer,
	ChartCrosshair,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	componentToString,
} from "#console/components/ui/chart";

interface Props {
	dateRange?: string;
}

const props = withDefaults(defineProps<Props>(), {
	dateRange: "7d",
});

const chartData = [
	{ date: new Date("2024-06-24"), hits: 850, misses: 420 },
	{ date: new Date("2024-06-25"), hits: 920, misses: 380 },
	{ date: new Date("2024-06-26"), hits: 1050, misses: 410 },
	{ date: new Date("2024-06-27"), hits: 980, misses: 360 },
	{ date: new Date("2024-06-28"), hits: 1180, misses: 450 },
	{ date: new Date("2024-06-29"), hits: 1290, misses: 480 },
	{ date: new Date("2024-06-30"), hits: 1210, misses: 430 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	hits: {
		label: "Cache Hits",
		color: "var(--chart-3)",
		icon: CheckCircle,
	},
	misses: {
		label: "Cache Misses",
		color: "var(--chart-4)",
		icon: XCircle,
	},
} satisfies ChartConfig;

// Calculate maximum y-value for dynamic domain (hits + misses stacked)
const maxValue = Math.max(...chartData.map((d) => d.hits + d.misses));

const svgDefs = `
  <linearGradient id="fillHits" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-hits)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-hits)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillMisses" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-misses)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-misses)" stop-opacity="0.1" />
  </linearGradient>
`;
</script>

<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full">
    <VisXYContainer
      :data="chartData"
      :svg-defs="svgDefs"
      :margin="{ left: -40, top: 10, bottom: 10 }"
      :y-domain="[0, maxValue * 1.1]"
    >
      <VisArea
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.misses, (d: Data) => d.hits]"
        :color="
          (d: Data, i: number) => ['url(#fillMisses)', 'url(#fillHits)'][i]
        "
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.misses, (d: Data) => d.misses + d.hits]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.misses.color, chartConfig.hits.color][i]
        "
        :line-width="2"
      />
      <VisAxis
        type="x"
        :x="(d: Data) => d.date"
        :tick-line="false"
        :domain-line="false"
        :grid-line="false"
        :num-ticks="6"
        :tick-format="
          (d: number) => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }
        "
      />
      <VisAxis
        type="y"
        :num-ticks="3"
        :tick-line="false"
        :domain-line="false"
      />
      <ChartTooltip />
      <ChartCrosshair
        :template="
          componentToString(chartConfig, ChartTooltipContent, {
            labelFormatter: (d) => {
              return new Date(d).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            },
          })
        "
        :color="
          (d: Data, i: number) =>
            [chartConfig.misses.color, chartConfig.hits.color][i % 2]
        "
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
