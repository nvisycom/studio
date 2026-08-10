import {
	formatRelativeTime,
	formatRelativeTimeFuture,
} from "#console/utils/date";

/**
 * Relative-time formatters bound to the active i18n instance, so call sites
 * don't have to thread `t` through every invocation.
 */
export function useRelativeTime() {
	const { t } = useI18n();

	return {
		/** e.g. "2d ago"; "Never" when the date is missing. */
		relativeTime: (date: string | null | undefined) =>
			formatRelativeTime(date, t),
		/** e.g. "in 3d"; "Expired" when the date is in the past. */
		relativeTimeFuture: (date: string | null | undefined) =>
			formatRelativeTimeFuture(date, t),
	};
}
