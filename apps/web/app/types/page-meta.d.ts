import type { Feature } from "#console/composables/useFeatures";

declare module "#app" {
	interface PageMeta {
		/** Breadcrumb category label shown in the app header. */
		pageCategory?: string;
		/**
		 * Cloud-only feature this page belongs to. When the feature is disabled
		 * for the current deployment edition, the route 404s (see
		 * `middleware/feature.global.ts`).
		 */
		feature?: Feature;
	}
}

export {};
