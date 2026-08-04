/**
 * Cloud-only features. Each is gated off unless the app is running the "cloud"
 * deployment edition (see `runtimeConfig.public.deployment`). Self-hosted
 * builds get everything NOT listed here; anything on this allowlist stays
 * hidden, so a missing or misconfigured deployment flag never exposes a
 * SaaS-only surface.
 */
export const CLOUD_ONLY_FEATURES = ["billing", "oauth", "support"] as const;

export type Feature = (typeof CLOUD_ONLY_FEATURES)[number];

/**
 * Deployment-aware feature flags.
 *
 * This is the single source of truth for edition gating. If the source ever
 * moves from a build-time env flag to runtime API capabilities, only this
 * composable changes — call sites keep using `has(...)`.
 */
export function useFeatures() {
	const isCloud = useRuntimeConfig().public.deployment === "cloud";

	function has(feature: Feature): boolean {
		// Non-cloud editions get everything except the cloud-only allowlist.
		return isCloud || !CLOUD_ONLY_FEATURES.includes(feature);
	}

	return {
		isCloud,
		isSelfHosted: !isCloud,
		has,
	};
}
