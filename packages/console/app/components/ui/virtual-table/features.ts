import {
	tableFeatures,
	columnSizingFeature,
	columnVisibilityFeature,
} from "@tanstack/vue-table";

/**
 * The minimal TanStack Table v9 feature set VirtualTable enables: column sizing
 * (for widths) and column visibility (required by `getVisibleCells`).
 * Everything else — sorting, filtering, expanding — is intentionally out;
 * selection, actions, and paging are handled by VirtualTable itself.
 */
export const tableFeatureSet = tableFeatures({
	columnSizingFeature,
	columnVisibilityFeature,
});

export type TableFeatureSet = typeof tableFeatureSet;
