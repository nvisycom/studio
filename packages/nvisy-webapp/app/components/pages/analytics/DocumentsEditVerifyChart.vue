<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { PenLine, BadgeCheck } from "lucide-vue-next";
import {
	ChartContainer,
	ChartCrosshair,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	componentToString,
} from "@/components/ui/chart";

interface Props {
	dateRange?: string;
}

const props = withDefaults(defineProps<Props>(), {
	dateRange: "7d",
});

const chartData = [
	{ date: new Date("2024-06-24"), edited: 28, verified: 35 },
	{ date: new Date("2024-06-25"), edited: 32, verified: 41 },
	{ date: new Date("2024-06-26"), edited: 38, verified: 48 },
	{ date: new Date("2024-06-27"), edited: 35, verified: 44 },
	{ date: new Date("2024-06-28"), edited: 42, verified: 52 },
	{ date: new Date("2024-06-29"), edited: 48, verified: 58 },
	{ date: new Date("2024-06-30"), edited: 45, verified: 55 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	edited: {
		label: "Edited",
		color: "var(--chart-2)",
		icon: PenLine,
	},
	verified: {
		label: "Verified",
		color: "var(--chart-3)",
		icon: BadgeCheck,
	},
} satisfies ChartConfig;

// Calculate max value for y-domain (cumulative)
const maxValue = Math.max(...chartData.map((d) => d.edited + d.verified));

const svgDefs = `
  <linearGradient id="fillEdited" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-edited)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-edited)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillVerified" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-verified)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-verified)" stop-opacity="0.1" />
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
        :y="[(d: Data) => d.edited, (d: Data) => d.verified]"
        :color="
          (d: Data, i: number) => ['url(#fillEdited)', 'url(#fillVerified)'][i]
        "
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.edited, (d: Data) => d.edited + d.verified]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.edited.color, chartConfig.verified.color][i]
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
            [chartConfig.edited.color, chartConfig.verified.color][i % 2]
        "
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
