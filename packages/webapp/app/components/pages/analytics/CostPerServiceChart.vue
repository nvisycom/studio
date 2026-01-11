<script setup lang="ts">
import type { ChartConfig } from "@/components/ui/chart";
import { Donut } from "@unovis/ts";
import { VisDonut, VisSingleContainer } from "@unovis/vue";
import { Database, Cpu, HardDrive, Network } from "lucide-vue-next";
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
	{ service: "ai", cost: 1250, fill: "var(--color-ai)" },
	{ service: "storage", cost: 650, fill: "var(--color-storage)" },
	{ service: "compute", cost: 480, fill: "var(--color-compute)" },
	{ service: "network", cost: 320, fill: "var(--color-network)" },
];

type Data = (typeof chartData)[number];

const chartConfig = {
	cost: {
		label: "Cost ($)",
	},
	ai: {
		label: "AI Services",
		color: "var(--chart-1)",
		icon: Cpu,
	},
	storage: {
		label: "Storage",
		color: "var(--chart-2)",
		icon: HardDrive,
	},
	compute: {
		label: "Compute",
		color: "var(--chart-3)",
		icon: Database,
	},
	network: {
		label: "Network",
		color: "var(--chart-4)",
		icon: Network,
	},
} satisfies ChartConfig;
</script>

<template>
  <ChartContainer
    :config="chartConfig"
    class="mx-auto aspect-square max-h-[250px]"
  >
    <VisSingleContainer :data="chartData" :margin="{ top: 30, bottom: 30 }">
      <VisDonut
        :value="(d: Data) => d.cost"
        :color="
          (d: Data) =>
            (
              chartConfig[d.service as keyof typeof chartConfig] as {
                color?: string;
              }
            )?.color ?? ''
        "
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
