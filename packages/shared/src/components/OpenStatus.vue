<template>
	<a
		href="https://nvisy.openstatus.dev"
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex items-center gap-1.5 text-xs hover:text-neutral-900 dark:hover:text-neutral-400 transition-colors"
	>
		<!-- Status Indicator -->
		<div class="relative flex-shrink-0">
			<!-- Loading state -->
			<div
				v-if="isLoading"
				class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-600 animate-pulse"
				title="Loading status..."
			/>

			<!-- Error state -->
			<div
				v-else-if="hasError"
				class="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500"
				title="Unable to load status"
			/>

			<!-- Normal status indicator -->
			<template v-else>
				<div
					:class="[
						'w-2 h-2 rounded-full transition-colors duration-300',
						statusConfig.dotColor,
					]"
					:title="statusConfig.label"
				/>
				<!-- Operational pulse animation -->
				<div
					v-show="currentStatus === 'operational'"
					:class="[
						'absolute inset-0 w-2 h-2 rounded-full animate-ping opacity-30',
						statusConfig.dotColor,
					]"
				/>
			</template>
		</div>

		<!-- Status Label -->
		<span v-if="isLoading">Loading</span>
		<span v-else-if="hasError">Unavailable</span>
		<span v-else>{{ statusConfig.label }}</span>
	</a>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { type StatusLevel, useOpenstatus } from "../composables/useOpenstatus";

const store = useOpenstatus();
const { currentStatus, isLoading, hasError } = store;

// Status configuration mapping
const statusConfig = computed(() => {
	const configs: Record<StatusLevel, { label: string; dotColor: string }> = {
		operational: {
			label: "All systems operational",
			dotColor: "bg-green-500",
		},
		degraded_performance: {
			label: "Degraded performance",
			dotColor: "bg-yellow-500",
		},
		partial_outage: {
			label: "Partial outage",
			dotColor: "bg-orange-500",
		},
		major_outage: {
			label: "Major outage",
			dotColor: "bg-red-500",
		},
		under_maintenance: {
			label: "Under maintenance",
			dotColor: "bg-blue-500",
		},
		incident: {
			label: "Incident reported",
			dotColor: "bg-red-500",
		},
		unknown: {
			label: "Status unknown",
			dotColor: "bg-neutral-400",
		},
	};

	return configs[currentStatus as StatusLevel] || configs.unknown;
});
</script>
