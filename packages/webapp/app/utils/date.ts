/**
 * Format a date as a relative time string (e.g., "2 days ago", "3 weeks ago")
 * Uses i18n keys from common.time namespace
 */
export function formatRelativeTime(
  dateString: string | null | undefined,
  t: (key: string, params?: Record<string, unknown>) => string,
): string {
  if (!dateString) return t("common.time.never");

  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (hours < 1) return t("common.time.justNow");
  if (hours < 24) return t("common.time.hoursAgo", { hours });
  if (days === 1) return t("common.time.daysAgo", { days: 1 });
  if (days < 7) return t("common.time.daysAgo", { days });
  if (weeks === 1) return t("common.time.weeksAgo", { weeks: 1 });
  if (weeks < 4) return t("common.time.weeksAgo", { weeks });
  if (months === 1) return t("common.time.monthsAgo", { months: 1 });
  return t("common.time.monthsAgo", { months });
}
