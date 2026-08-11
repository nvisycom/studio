import {
	columnFilteringFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createExpandedRowModel,
	createFilteredRowModel,
	createSortedRowModel,
	globalFilteringFeature,
	rowExpandingFeature,
	rowSelectionFeature,
	rowSortingFeature,
	tableFeatures,
} from "@tanstack/vue-table";

/**
 * The v9 feature set our DataTable relies on. TanStack Table v9 made features
 * opt-in: row models and the sorting/visibility/filtering/selection/expanding
 * behaviours are declared here and passed to `useTable`, rather than the v8
 * `getCoreRowModel()` / `useVueTable` inline style. Core features are implicit.
 */
export const dataTableFeatures = tableFeatures({
	columnFilteringFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	globalFilteringFeature,
	rowExpandingFeature,
	rowSelectionFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	expandedRowModel: createExpandedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;
