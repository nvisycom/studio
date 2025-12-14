<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { Zap, Server } from "lucide-vue-next";
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
  { date: new Date("2024-06-24"), ai: 750, other: 450 },
  { date: new Date("2024-06-25"), ai: 950, other: 550 },
  { date: new Date("2024-06-26"), ai: 1150, other: 650 },
  { date: new Date("2024-06-27"), ai: 1000, other: 600 },
  { date: new Date("2024-06-28"), ai: 1350, other: 750 },
  { date: new Date("2024-06-29"), ai: 1550, other: 850 },
  { date: new Date("2024-06-30"), ai: 1400, other: 800 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
  credits: {
    label: "Credits",
  },
  other: {
    label: "Other",
    color: "var(--chart-1)",
    icon: Server,
  },
  ai: {
    label: "AI",
    color: "var(--chart-2)",
    icon: Zap,
  },
} satisfies ChartConfig;

// Calculate max value for y-domain (cumulative)
const maxValue = Math.max(...chartData.map((d) => d.other + d.ai));

const svgDefs = `
  <linearGradient id="fillOther" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-other)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-other)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillAi" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-ai)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-ai)" stop-opacity="0.1" />
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
        :y="[(d: Data) => d.other, (d: Data) => d.ai]"
        :color="(d: Data, i: number) => ['url(#fillOther)', 'url(#fillAi)'][i]"
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.other, (d: Data) => d.other + d.ai]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.other.color, chartConfig.ai.color][i]
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
            labelKey: 'credits',
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
