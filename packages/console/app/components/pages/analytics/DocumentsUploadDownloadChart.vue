<script setup lang="ts">
import type { ChartConfig } from "#console/components/ui/chart";
import { VisArea, VisAxis, VisLine, VisXYContainer } from "@unovis/vue";
import { Upload, Download } from "@lucide/vue";
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
	{ date: new Date("2024-06-24"), uploaded: 45, downloaded: 32 },
	{ date: new Date("2024-06-25"), uploaded: 52, downloaded: 38 },
	{ date: new Date("2024-06-26"), uploaded: 61, downloaded: 45 },
	{ date: new Date("2024-06-27"), uploaded: 58, downloaded: 41 },
	{ date: new Date("2024-06-28"), uploaded: 67, downloaded: 49 },
	{ date: new Date("2024-06-29"), uploaded: 72, downloaded: 55 },
	{ date: new Date("2024-06-30"), uploaded: 69, downloaded: 52 },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	uploaded: {
		label: "Uploaded",
		color: "var(--chart-1)",
		icon: Upload,
	},
	downloaded: {
		label: "Downloaded",
		color: "var(--chart-2)",
		icon: Download,
	},
} satisfies ChartConfig;

// Calculate max value for y-domain (cumulative)
const maxValue = Math.max(...chartData.map((d) => d.uploaded + d.downloaded));

const svgDefs = `
  <linearGradient id="fillUploaded" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-uploaded)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-uploaded)" stop-opacity="0.1" />
  </linearGradient>
  <linearGradient id="fillDownloaded" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stop-color="var(--color-downloaded)" stop-opacity="0.8" />
    <stop offset="95%" stop-color="var(--color-downloaded)" stop-opacity="0.1" />
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
        :y="[(d: Data) => d.downloaded, (d: Data) => d.uploaded]"
        :color="
          (d: Data, i: number) =>
            ['url(#fillDownloaded)', 'url(#fillUploaded)'][i]
        "
        :opacity="0.6"
      />
      <VisLine
        :x="(d: Data) => d.date"
        :y="[(d: Data) => d.downloaded, (d: Data) => d.downloaded + d.uploaded]"
        :color="
          (d: Data, i: number) =>
            [chartConfig.downloaded.color, chartConfig.uploaded.color][i]
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
            [chartConfig.downloaded.color, chartConfig.uploaded.color][i % 2]
        "
      />
    </VisXYContainer>
    <ChartLegendContent />
  </ChartContainer>
</template>
