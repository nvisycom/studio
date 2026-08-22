type Translate = (key: string, params?: Record<string, unknown>) => string;

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

/** Break a signed millisecond delta into the buckets both relative-time formatters share. */
function relativeBuckets(diff: number) {
	const abs = Math.abs(diff);
	return {
		minutes: Math.floor(abs / MINUTE),
		hours: Math.floor(abs / HOUR),
		days: Math.floor(abs / DAY),
		weeks: Math.floor(abs / DAY / 7),
		months: Math.floor(abs / DAY / 30),
	};
}

/**
 * Format a date as a relative time string (e.g., "2 days ago", "3 weeks ago").
 * Uses i18n keys from the common.time namespace.
 */
export function formatRelativeTime(
	dateString: string | null | undefined,
	t: Translate,
): string {
	if (!dateString) return t("common.time.never");

	const diff = Date.now() - new Date(dateString).getTime();
	const { minutes, hours, days, weeks, months } = relativeBuckets(diff);

	if (minutes < 1) return t("common.time.justNow");
	if (hours < 1) return t("common.time.minutesAgo", { minutes });
	if (hours < 24) return t("common.time.hoursAgo", { hours });
	if (days < 7) return t("common.time.daysAgo", { days });
	if (weeks < 4) return t("common.time.weeksAgo", { weeks });
	return t("common.time.monthsAgo", { months });
}

/**
 * Format a future date as a relative time string (e.g., "in 2 days", "in 3 months").
 * Uses i18n keys from the common.time namespace.
 */
export function formatRelativeTimeFuture(
	dateString: string | null | undefined,
	t: Translate,
): string {
	if (!dateString) return t("common.time.never");

	const diff = new Date(dateString).getTime() - Date.now();
	if (diff < 0) return t("common.time.expired");

	const { minutes, hours, days, weeks, months } = relativeBuckets(diff);

	if (minutes < 1) return t("common.time.now");
	if (hours < 1) return t("common.time.inMinutes", { minutes });
	if (hours < 24) return t("common.time.inHours", { hours });
	if (days < 7) return t("common.time.inDays", { days });
	if (days < 30) return t("common.time.inWeeks", { weeks });
	return t("common.time.inMonths", { months });
}

/**
 * Format the elapsed time between two ISO timestamps as "Xm Ys".
 * Returns "-" when the end timestamp is missing (e.g. still running).
 */
export function formatDuration(
	startedAt: string,
	completedAt: string | null | undefined,
): string {
	if (!completedAt) return "-";
	const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime();
	const minutes = Math.floor(diff / MINUTE);
	const seconds = Math.floor((diff % MINUTE) / 1000);
	return `${minutes}m ${seconds}s`;
}

/**
 * Format a raw millisecond duration compactly: sub-second as "850ms", under a
 * minute as "4.2s", otherwise "2m 5s". For analytics figures (avg/p95 run time).
 */
export function formatDurationMs(ms: number): string {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	if (ms < MINUTE) return `${(ms / 1000).toFixed(1)}s`;
	// Round to whole seconds first, then split — otherwise rounding the
	// remainder can produce "1m 60s" instead of "2m 0s".
	const totalSeconds = Math.round(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}m ${seconds}s`;
}

/** Format a date as a short "Mon D" label (e.g. "Jan 5"). */
export function formatShortDate(date: string | number | Date): string {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
	});
}

/** Format a date as "Mon D, YYYY" (e.g. "Jan 5, 2024"). */
export function formatLongDate(date: string | number | Date): string {
	return new Date(date).toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

/** Format a date as "Mon D, YYYY, HH:MM:SS" (long date + time). */
export function formatDateTime(date: string | number | Date): string {
	return new Date(date).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}
