import type { Feature } from "#console/composables/useFeatures";

declare module "#app" {
	interface PageMeta {
		/** Breadcrumb category label shown in the app header. */
		pageCategory?: string;
		/**
		 * Hide the header category breadcrumb for this page, freeing the space for
		 * the page's own header content (e.g. the studio's open-file tabs).
		 */
		hideCategory?: boolean;
		/**
		 * Cloud-only feature this page belongs to. When the feature is disabled
		 * for the current deployment edition, the route 404s (see
		 * `middleware/feature.global.ts`).
		 */
		feature?: Feature;
	}
}
