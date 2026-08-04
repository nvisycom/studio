import type { HealthStatus } from "@nvisy/sdk/datatypes";

/**
 * Local UI status. Mirrors the SDK's {@link HealthStatus} (`healthy`,
 * `degraded`, `unhealthy`) plus an `unknown` fallback for when the health
 * endpoint can't be reached (offline, no client, request failed).
 */
export type HealthLevel = HealthStatus | "unknown";

// i18n key (under `health.status.*`) for each level's human-readable label.
export const healthLabelKeys: Record<HealthLevel, string> = {
	healthy: "health.status.healthy",
	degraded: "health.status.degraded",
	unhealthy: "health.status.unhealthy",
	unknown: "health.status.unknown",
};

export interface HealthVisual {
	textColor: string;
	dotColor: string;
}

export function getHealthVisual(level: HealthLevel): HealthVisual {
	switch (level) {
		case "healthy":
			return { textColor: "text-green-400", dotColor: "bg-green-500" };
		case "degraded":
			return { textColor: "text-yellow-400", dotColor: "bg-yellow-500" };
		case "unhealthy":
			return { textColor: "text-red-400", dotColor: "bg-red-500" };
		default:
			return { textColor: "text-gray-400", dotColor: "bg-gray-400" };
	}
}

/**
 * Reactive service health, sourced from the SDK's `GET /health/` endpoint.
 * Falls back to `unknown` when the client is unavailable or the request fails,
 * so the footer indicator always has something to render.
 */
export function useHealth() {
	const { $nvisyClient } = useNuxtApp();

	const {
		data,
		error,
		isPending: isLoading,
		refresh,
	} = useQuery({
		key: ["health"],
		query: async () => {
			const client = $nvisyClient.value;
			if (!client) return null;
			return await client.status.checkHealth();
		},
		staleTime: 2 * 60 * 1000, // 2 minutes
		refetchOnMount: true,
	});

	const currentStatus = computed<HealthLevel>(
		() => data.value?.status ?? "unknown",
	);
	const labelKey = computed(() => healthLabelKeys[currentStatus.value]);
	const statusConfig = computed(() => getHealthVisual(currentStatus.value));

	return {
		health: data,
		error,
		isLoading,
		currentStatus,
		labelKey,
		statusConfig,
		isHealthy: computed(() => currentStatus.value === "healthy"),
		hasError: computed(() => !!error.value),
		refresh,
	};
}
