<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { Donut } from "@unovis/ts";
import { VisDonut, VisSingleContainer } from "@unovis/vue";
import {
  ChartContainer,
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
  { type: "pdf", count: 450, fill: "url(#gradientPdf)" },
  { type: "docx", count: 320, fill: "url(#gradientDocx)" },
  { type: "xlsx", count: 180, fill: "url(#gradientXlsx)" },
  { type: "jpg", count: 140, fill: "url(#gradientJpg)" },
  { type: "other", count: 95, fill: "url(#gradientOther)" },
];

type Data = (typeof chartData)[number];

const svgDefs = `
  <linearGradient id="gradientPdf" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--color-pdf)" stop-opacity="1" />
    <stop offset="100%" stop-color="var(--color-pdf)" stop-opacity="0.6" />
  </linearGradient>
  <linearGradient id="gradientDocx" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--color-docx)" stop-opacity="1" />
    <stop offset="100%" stop-color="var(--color-docx)" stop-opacity="0.6" />
  </linearGradient>
  <linearGradient id="gradientXlsx" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--color-xlsx)" stop-opacity="1" />
    <stop offset="100%" stop-color="var(--color-xlsx)" stop-opacity="0.6" />
  </linearGradient>
  <linearGradient id="gradientJpg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--color-jpg)" stop-opacity="1" />
    <stop offset="100%" stop-color="var(--color-jpg)" stop-opacity="0.6" />
  </linearGradient>
  <linearGradient id="gradientOther" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="var(--color-other)" stop-opacity="1" />
    <stop offset="100%" stop-color="var(--color-other)" stop-opacity="0.6" />
  </linearGradient>
`;

const chartConfig = {
  count: {
    label: "Documents",
  },
  pdf: {
    label: "PDF",
    color: "var(--chart-1)",
  },
  docx: {
    label: "DOCX",
    color: "var(--chart-2)",
  },
  xlsx: {
    label: "XLSX",
    color: "var(--chart-3)",
  },
  jpg: {
    label: "JPG/PNG",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;
</script>

<template>
  <ChartContainer
    :config="chartConfig"
    class="mx-auto aspect-square max-h-[250px]"
  >
    <VisSingleContainer
      :data="chartData"
      :svg-defs="svgDefs"
      :margin="{ top: 30, bottom: 30 }"
    >
      <VisDonut
        :value="(d: Data) => d.count"
        :color="(d: Data) => d.fill"
        :arc-width="30"
      />
      <ChartTooltip
        :triggers="{
          [Donut.selectors.segment]: componentToString(
            chartConfig,
            ChartTooltipContent,
            {
              hideLabel: true,
            },
          )!,
        }"
      />
    </VisSingleContainer>
  </ChartContainer>
</template>
