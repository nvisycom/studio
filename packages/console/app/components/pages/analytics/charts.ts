import type { Component } from "vue";
import {
	AlertTriangle,
	BadgeCheck,
	CheckCircle,
	Cpu,
	Download,
	FileEdit,
	FileImage,
	PenLine,
	Server,
	Upload,
	XCircle,
	Zap,
} from "@lucide/vue";

/**
 * The analytics charts render placeholder/mock series today. Each chart is one
 * of two shapes — a stacked area chart or a donut — so instead of a component
 * per chart, the shape is a parameterized component and this module holds the
 * per-chart metadata + sample data that drives it.
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
	/** Sample rows: `{ date, [seriesKey]: number }`. */
	data: Array<Record<string, number | Date>>;
	/** Fixed y-domain; when omitted the chart derives it from the data. */
	yDomain?: [number, number];
	/** Tooltip header label key (defaults to the sole series for single-series). */
	labelKey?: string;
}

const DATES = [
	"2024-06-24",
	"2024-06-25",
	"2024-06-26",
	"2024-06-27",
	"2024-06-28",
	"2024-06-29",
	"2024-06-30",
].map((d) => new Date(d));

/** Build sample rows from parallel value arrays keyed by series. */
function rows(
	series: Record<string, number[]>,
): Array<Record<string, number | Date>> {
	return DATES.map((date, i) => {
		const row: Record<string, number | Date> = { date };
		for (const [key, values] of Object.entries(series)) {
			row[key] = values[i] ?? 0;
		}
		return row;
	});
}

export const AREA_CHARTS = {
	credits: {
		series: [
			{ key: "other", label: "Other", color: "var(--chart-1)", icon: Server },
			{ key: "ai", label: "AI", color: "var(--chart-2)", icon: Zap },
		],
		data: rows({
			other: [450, 550, 650, 600, 750, 850, 800],
			ai: [750, 950, 1150, 1000, 1350, 1550, 1400],
		}),
		labelKey: "other",
	},
	storage: {
		series: [
			{
				key: "original",
				label: "Original",
				color: "var(--chart-1)",
				icon: FileImage,
			},
			{
				key: "edited",
				label: "Edited",
				color: "var(--chart-2)",
				icon: FileEdit,
			},
		],
		data: rows({
			original: [28.5, 29.2, 30.1, 30.5, 30.9, 31.4, 32.0],
			edited: [11.6, 12.1, 12.4, 12.7, 12.9, 13.1, 13.2],
		}),
		yDomain: [0, 50],
	},
	uploadDownload: {
		series: [
			{
				key: "uploaded",
				label: "Uploaded",
				color: "var(--chart-1)",
				icon: Upload,
			},
			{
				key: "downloaded",
				label: "Downloaded",
				color: "var(--chart-2)",
				icon: Download,
			},
		],
		data: rows({
			uploaded: [45, 52, 61, 58, 67, 72, 69],
			downloaded: [32, 38, 45, 41, 49, 55, 52],
		}),
	},
	editVerify: {
		series: [
			{
				key: "edited",
				label: "Edited",
				color: "var(--chart-2)",
				icon: PenLine,
			},
			{
				key: "verified",
				label: "Verified",
				color: "var(--chart-3)",
				icon: BadgeCheck,
			},
		],
		data: rows({
			edited: [28, 32, 38, 35, 42, 48, 45],
			verified: [35, 41, 48, 44, 52, 58, 55],
		}),
	},
	aiUsage: {
		series: [
			{
				key: "ocr",
				label: "OCR Credits",
				color: "var(--chart-1)",
				icon: FileImage,
			},
			{ key: "vlm", label: "VLM Tokens", color: "var(--chart-2)", icon: Cpu },
		],
		data: rows({
			ocr: [450, 520, 610, 580, 670, 720, 690],
			vlm: [12500, 14200, 16800, 15300, 18900, 21400, 19800],
		}),
	},
	vlmCache: {
		series: [
			{
				key: "hits",
				label: "Cache Hits",
				color: "var(--chart-3)",
				icon: CheckCircle,
			},
			{
				key: "misses",
				label: "Cache Misses",
				color: "var(--chart-4)",
				icon: XCircle,
			},
		],
		data: rows({
			hits: [850, 920, 1050, 980, 1180, 1290, 1210],
			misses: [420, 380, 410, 360, 450, 480, 430],
		}),
	},
	errorRate: {
		series: [
			{
				key: "value",
				label: "Error Rate (%)",
				color: "var(--chart-5)",
				icon: AlertTriangle,
			},
		],
		data: rows({ value: [2.3, 1.8, 2.1, 1.5, 1.9, 1.2, 1.4] }),
		yDomain: [0, 5],
	},
	responseTime: {
		series: [
			{
				key: "value",
				label: "Response Time (ms)",
				color: "var(--chart-3)",
				icon: Zap,
			},
		],
		data: rows({ value: [245, 220, 198, 235, 210, 185, 175] }),
		yDomain: [0, 300],
	},
} satisfies Record<string, AreaChartSpec>;
