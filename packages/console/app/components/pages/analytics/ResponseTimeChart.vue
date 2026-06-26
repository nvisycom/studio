<script setup lang="ts">
import type { ChartConfig } from "#console/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { Zap } from "@lucide/vue";
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
	{ date: new Date("2024-06-24"), value: 245 },
	{ date: new Date("2024-06-25"), value: 220 },
	{ date: new Date("2024-06-26"), value: 198 },
	{ date: new Date("2024-06-27"), value: 235 },
	{ date: new Date("2024-06-28"), value: 210 },
	{ date: new Date("2024-06-29"), value: 185 },
	{ date: new Date("2024-06-30"), value: 175 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	value: {
		label: "Response Time (ms)",
		color: "var(--chart-3)",
		icon: Zap,
	},
} satisfies ChartConfig;

const svgDefs = `
  <linearGradient id="fillResponseTime" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-value)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-value)" stop-opacity="0.1" />
  </linearGradient>
`;
</script>

<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full">
    <VisXYContainer
      :data="chartData"
      :svg-defs="svgDefs"
      :margin="{ left: -40, top: 10, bottom: 10 }"
      :y-domain="[0, 300]"
    >
      <VisArea
        :x="(d: Data) => d.date"
        :y="(d: Data) => d.value"
        color="url(#fillResponseTime)"
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="(d: Data) => d.value"
        :color="chartConfig.value.color"
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
        :color="chartConfig.value.color"
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
