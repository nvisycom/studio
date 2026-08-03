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

export interface StatusVisual {
	label: string;
	textColor: string;
	dotColor: string;
}

export function getStatusVisual(statusLevel: string): StatusVisual {
	let statusLabel = statusLabels.unknown;
	if (statusLevel in statusLabels) {
		statusLabel = statusLabels[statusLevel as StatusLevel];
	}

	switch (statusLevel) {
		case "operational":
			return {
				label: statusLabel,
				textColor: "text-green-400",
				dotColor: "bg-green-500",
			};
		case "degraded_performance":
			return {
				label: statusLabel,
				textColor: "text-yellow-400",
				dotColor: "bg-yellow-500",
			};
		case "partial_outage":
			return {
				label: statusLabel,
				textColor: "text-orange-400",
				dotColor: "bg-orange-500",
			};
		case "major_outage":
		case "incident":
			return {
				label: statusLabel,
				textColor: "text-red-400",
				dotColor: "bg-red-500",
			};
		case "under_maintenance":
			return {
				label: statusLabel,
				textColor: "text-blue-400",
				dotColor: "bg-blue-500",
			};
		default:
			return {
				label: statusLabel,
				textColor: "text-gray-400",
				dotColor: "bg-gray-400",
			};
	}
}

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

	// Status configuration for UI styling
	const statusConfig = computed(() => {
		return getStatusVisual(currentStatus.value);
	});

	return {
		// State
		statusData,
		error,
		isLoading,

		// Computed values
		currentStatus,
		statusLabel,
		statusConfig,

		// Actions
		refresh,
	};
});

// Composable for easy usage in components
export function useOpenstatus() {
	const store = useOpenstatusStore();

	// State and getters are already reactive; storeToRefs preserves that without
	// re-wrapping each one in a redundant computed.
	const {
		statusData,
		error,
		isLoading,
		currentStatus,
		statusLabel,
		statusConfig,
	} = storeToRefs(store);

	return {
		statusData,
		error,
		isLoading,
		currentStatus,
		statusLabel,
		statusConfig,

		// Genuinely derived helpers.
		isOperational: computed(() => currentStatus.value === "operational"),
		hasError: computed(() => !!error.value),
		isHealthy: computed(
			() =>
				currentStatus.value === "operational" ||
				currentStatus.value === "under_maintenance",
		),
		// Alias for refresh
		fetchStatus: store.refresh,
		refresh: store.refresh,
	};
}
