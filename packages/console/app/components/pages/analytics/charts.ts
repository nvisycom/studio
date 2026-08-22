import type { Component } from "vue";

/**
 * Shared shape for the analytics area charts. The chart is a parameterized
 * component (AnalyticsAreaChart) driven by this spec; callers build the spec
 * from real data (e.g. the daily run time-series on the analytics page).
 */

/** One measured series in an area chart. */
export interface AreaSeries {
	/** Key on each data row holding this series' value. */
	key: string;
	label: string;
	/** CSS color (e.g. "var(--chart-1)"). */
	color: string;
	icon: Component;
}

export interface AreaChartSpec {
	series: AreaSeries[];
	/** Data rows: `{ date, [seriesKey]: number }`. */
	data: Array<Record<string, number | Date>>;
	/** Fixed y-domain; when omitted the chart derives it from the data. */
	yDomain?: [number, number];
	/** Tooltip header label key (defaults to the sole series for single-series). */
	labelKey?: string;
}
