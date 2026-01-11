<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { FileImage, FileEdit } from "lucide-vue-next";
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
	{ date: new Date("2024-06-24"), original: 28.5, edited: 11.6 },
	{ date: new Date("2024-06-25"), original: 29.2, edited: 12.1 },
	{ date: new Date("2024-06-26"), original: 30.1, edited: 12.4 },
	{ date: new Date("2024-06-27"), original: 30.5, edited: 12.7 },
	{ date: new Date("2024-06-28"), original: 30.9, edited: 12.9 },
	{ date: new Date("2024-06-29"), original: 31.4, edited: 13.1 },
	{ date: new Date("2024-06-30"), original: 32.0, edited: 13.2 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	storage: {
		label: "Storage (GB)",
	},
	original: {
		label: "Original",
		color: "var(--chart-1)",
		icon: FileImage,
	},
	edited: {
		label: "Edited",
		color: "var(--chart-2)",
		icon: FileEdit,
	},
} satisfies ChartConfig;

const svgDefs = `
  <linearGradient id="fillOriginal" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-original)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-original)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillEdited" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-edited)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-edited)" stop-opacity="0.1" />
  </linearGradient>
`;
</script>

<template>
  <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full">
    <VisXYContainer
      :data="chartData"
      :svg-defs="svgDefs"
      :margin="{ left: -40, top: 10, bottom: 10 }"
      :y-domain="[0, 50]"
    >
      <VisArea
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.original, (d: Data) => d.edited]"
        :color="
          (d: Data, i: number) => ['url(#fillOriginal)', 'url(#fillEdited)'][i]
        "
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.original, (d: Data) => d.original + d.edited]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.original.color, chartConfig.edited.color][i]
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
            indicator: 'line',
            labelKey: 'storage',
            labelFormatter: (d) => {
              return new Date(d).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            },
          })
        "
        color="#0000"
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
