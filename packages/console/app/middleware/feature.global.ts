import type { Feature } from "#console/composables/useFeatures";

/**
 * Global feature-gate middleware.
 *
 * Pages that belong to a cloud-only feature declare it via
 * `definePageMeta({ feature: "billing" })`. When that feature is disabled for
 * the current deployment edition (e.g. self-hosted), the route 404s so it does
 * not exist in that edition.
 */
export default defineNuxtRouteMiddleware((to) => {
	// Skip on server-side; the deployment flag resolves the same, but 404s are
	// handled client-side in SPA mode (see pages/[...slug].vue).
	if (import.meta.server) return;

	const feature = to.meta.feature as Feature | undefined;
	if (!feature) return;

	const { has } = useFeatures();
	if (!has(feature)) {
		throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
	}
});
