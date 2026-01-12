<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

interface Props {
	slug: string;
	path?: string;
	showLabel?: boolean;
	refreshInterval?: number;
	url?: string;
}

const props = withDefaults(defineProps<Props>(), {
	path: "https://api.openstatus.dev/public/status/",
	showLabel: true,
	refreshInterval: 300000, // 5 minutes
	url: "https://nvisy.openstatus.dev",
});

type Status =
	| "operational"
	| "degraded_performance"
	| "partial_outage"
	| "major_outage"
	| "under_maintenance"
	| "unknown"
	| "incident";

const currentStatus = ref<Status>("unknown");
const lastUpdated = ref<Date | null>(null);
const intervalId = ref<number | null>(null);
const currentTime = ref<Date>(new Date());
const timeIntervalId = ref<number | null>(null);

// Status configuration computed property
const statusConfig = computed(() => {
	return getStatusConfig(currentStatus.value);
});

// Update timestamp computed property
const updateTimestamp = computed(() => {
	if (!lastUpdated.value) {
		return "";
	}

	const current = currentTime.value.getTime();
	const last = lastUpdated.value.getTime();
	const passed = Math.floor((current - last) / 60000);
	const minutes = Math.max(1, passed);
	return `${minutes}m ago`;
});

// Status configuration function
function getStatusConfig(status: Status) {
	switch (status) {
		case "operational":
			return {
				label: "All systems operational",
				color: "text-green-600 dark:text-green-400",
				dotColor: "bg-green-500",
			};
		case "degraded_performance":
			return {
				label: "Degraded performance",
				color: "text-yellow-600 dark:text-yellow-400",
				dotColor: "bg-yellow-500",
			};
		case "partial_outage":
			return {
				label: "Partial outage",
				color: "text-orange-600 dark:text-orange-400",
				dotColor: "bg-orange-500",
			};
		case "major_outage":
			return {
				label: "Major outage",
				color: "text-red-600 dark:text-red-400",
				dotColor: "bg-red-500",
			};
		case "under_maintenance":
			return {
				label: "Under maintenance",
				color: "text-neutral-600 dark:text-neutral-400",
				dotColor: "bg-neutral-500",
			};
		case "incident":
			return {
				label: "Active incident",
				color: "text-red-600 dark:text-red-400",
				dotColor: "bg-red-500",
			};
		default:
			return {
				label: "Status unknown",
				color: "text-neutral-600 dark:text-neutral-400",
				dotColor: "bg-neutral-400",
			};
	}
}

// Fetch status from API
async function updateStatus() {
	try {
		const apiUrl = `${props.path}${props.slug}`;
		const response = await fetch(apiUrl, {
			headers: { Accept: "application/json" },
		});

		if (response.ok) {
			const data = await response.json();
			if (data && data.status) {
				currentStatus.value = data.status;
				lastUpdated.value = new Date();
			} else {
				console.warn("OpenStatus API returned empty or invalid data:", data);
				currentStatus.value = "unknown";
			}
		} else {
			console.warn(
				`OpenStatus API error (${response.status}): ${response.statusText} for slug "${props.slug}"`,
			);
			currentStatus.value = "unknown";
		}
	} catch (error) {
		console.error(
			`OpenStatus: Failed to fetch status for "${props.slug}":`,
			error,
		);
		currentStatus.value = "unknown";
	}
}

// Initialize component
onMounted(async () => {
	// Initial status fetch
	await updateStatus();

	// Set up periodic updates
	if (props.refreshInterval > 0) {
		intervalId.value = window.setInterval(() => {
			updateStatus();
		}, props.refreshInterval);
	}

	// Set up time updates for timestamp display
	timeIntervalId.value = window.setInterval(() => {
		currentTime.value = new Date();
	}, 60000); // Update every minute
});

onUnmounted(() => {
	if (intervalId.value) {
		clearInterval(intervalId.value);
	}
	if (timeIntervalId.value) {
		clearInterval(timeIntervalId.value);
	}
});
</script>

<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center space-x-3 group px-3 py-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 no-underline"
    :data-status-slug="slug"
    :data-status-path="path"
    :data-refresh-interval="refreshInterval"
    :data-show-label="showLabel"
  >
    <!-- Status Indicator -->
    <div class="relative flex-shrink-0">
      <div
        class="w-3 h-3 rounded-full transition-colors duration-300 shadow-sm"
        :class="statusConfig.dotColor"
        :title="statusConfig.label"
      ></div>
      <div
        v-show="currentStatus === 'operational'"
        class="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-30"
        :class="statusConfig.dotColor"
      ></div>
    </div>

    <!-- Status Label -->
    <span
      v-if="showLabel"
      class="text-sm font-medium transition-colors duration-300"
      :class="statusConfig.color"
    >
      {{ statusConfig.label }}
    </span>

    <!-- Last Updated -->
    <div
      v-if="lastUpdated"
      class="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 text-xs text-neutral-500 dark:text-neutral-400 font-mono"
      :title="`Last updated: ${lastUpdated.toLocaleString()}`"
    >
      {{ updateTimestamp }}
    </div>
  </a>
</template>
