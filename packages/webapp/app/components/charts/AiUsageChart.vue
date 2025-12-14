<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
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
  { date: new Date("2024-06-24"), ocr: 450, vlm: 12500 },
  { date: new Date("2024-06-25"), ocr: 520, vlm: 14200 },
  { date: new Date("2024-06-26"), ocr: 610, vlm: 16800 },
  { date: new Date("2024-06-27"), ocr: 580, vlm: 15300 },
  { date: new Date("2024-06-28"), ocr: 670, vlm: 18900 },
  { date: new Date("2024-06-29"), ocr: 720, vlm: 21400 },
  { date: new Date("2024-06-30"), ocr: 690, vlm: 19800 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
  ocr: {
    label: "OCR Credits",
    color: "var(--chart-1)",
  },
  vlm: {
    label: "VLM Tokens",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// Calculate max value for y-domain (cumulative)
const maxValue = Math.max(...chartData.map((d) => d.ocr + d.vlm));

const svgDefs = `
  <linearGradient id="fillOcrUsage" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-ocr)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-ocr)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillVlmUsage" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-vlm)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-vlm)" stop-opacity="0.1" />
  </linearGradient>
`;
</script>

<template>
  <ChartContainer
    :config="chartConfig"
    class="aspect-auto h-[250px] w-full"
  >
    <VisXYContainer
      :data="chartData"
      :svg-defs="svgDefs"
      :margin="{ left: -40, top: 10, bottom: 10 }"
      :y-domain="[0, maxValue * 1.1]"
    >
      <VisArea
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.ocr, (d: Data) => d.vlm]"
        :color="
          (d: Data, i: number) => ['url(#fillOcrUsage)', 'url(#fillVlmUsage)'][i]
        "
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.ocr, (d: Data) => d.ocr + d.vlm]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.ocr.color, chartConfig.vlm.color][i]
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
            [chartConfig.ocr.color, chartConfig.vlm.color][i % 2]
        "
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
