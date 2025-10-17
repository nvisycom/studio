import { useQuery } from "@pinia/colada";
import { defineStore } from "pinia";
import { computed } from "vue";

export type StatusLevel =
	| "operational"
	| "degraded_performance"
	| "partial_outage"
	| "major_outage"
	| "under_maintenance"
	| "unknown"
	| "incident";

export interface StatusResponse {
	status: StatusLevel;
}

// Human-readable status labels
export const statusLabels: Record<StatusLevel, string> = {
	operational: "All systems operational",
	degraded_performance: "Degraded performance",
	partial_outage: "Partial outage",
	major_outage: "Major outage",
	under_maintenance: "Under maintenance",
	unknown: "Status unknown",
	incident: "Incident reported",
};

// Simple API fetch function
async function fetchOpenStatus(): Promise<StatusResponse> {
	try {
		const response = await fetch(
			"https://api.openstatus.dev/public/status/nvisy",
			{
				headers: {
					Accept: "application/json",
				},
			},
		);

		if (!response.ok) {
			console.warn(
				`OpenStatus API error: ${response.status} ${response.statusText}`,
			);
			throw new Error(
				`OpenStatus API error: ${response.status} ${response.statusText}`,
			);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.warn("Failed to fetch OpenStatus:", error);
		return { status: "unknown" };
	}
}

export const useOpenstatusStore = defineStore("openstatus", () => {
	// Use PiniaColada's useQuery
	const {
		data: statusData,
		error,
		isPending: isLoading,
		refresh,
	} = useQuery({
		key: ["openstatus"],
		query: fetchOpenStatus,
		staleTime: 2 * 60 * 1000, // 2 minutes
		refetchOnMount: true,
	});

	// Current status with fallback
	const currentStatus = computed(() => statusData.value?.status ?? "unknown");
	const statusLabel = computed(() => {
		return statusLabels[currentStatus.value] || statusLabels.unknown;
	});

	return {
		// State
		statusData,
		error,
		isLoading,

		// Computed values
		currentStatus,
		statusLabel,

		// Actions
		refresh,
	};
});

// Composable for easy usage in components
export function useOpenstatus() {
	const store = useOpenstatusStore();

	return {
		...store,
		// Additional computed helpers
		isOperational: computed(() => store.currentStatus === "operational"),
		hasError: computed(() => !!store.error),
		isHealthy: computed(
			() =>
				store.currentStatus === "operational" ||
				store.currentStatus === "under_maintenance",
		),
		// Alias for refresh
		fetchStatus: store.refresh,
	};
}
