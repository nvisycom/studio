/**
 * Get initials from a name.
 *
 * @param name - The name to get initials from.
 * @param limit - Maximum number of initials to return (default: 2).
 * @returns The initials of the name.
 */
export function getInitials(name: string, limit: number = 2): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, limit);
}

/**
 * Human label for a person, using a single consistent fallback chain:
 * display name → username → email. Used everywhere a person is shown
 * (sidebar, account settings, team table, policy creator) so the visible
 * label — and the avatar gradient hashed from it — stays identical for the
 * same person across the app.
 *
 * @param person - Fields to derive the label from (all optional).
 * @returns The best available label, or "" when none are set.
 */
export function personLabel(person: {
	displayName?: string | null;
	username?: string | null;
	emailAddress?: string | null;
}): string {
	return person.displayName || person.username || person.emailAddress || "";
}

/**
 * Truncate a string to a maximum length with ellipsis.
 *
 * @param str - The string to truncate.
 * @param maxLength - Maximum length before truncation.
 * @returns The truncated string with ellipsis if needed.
 */
export function truncate(str: string, maxLength: number): string {
	if (str.length <= maxLength) return str;
	return `${str.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Turn a display name into a URL slug: lowercase alphanumerics with single
 * internal dashes (leading/trailing dashes trimmed). Used to derive the
 * immutable slug shown when creating a policy or pipeline.
 */
export function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/** Vibrant from→to gradient pairs an avatar is deterministically assigned. */
const GRADIENT_PAIRS = [
	{ from: "#3B82F6", to: "#EC4899" }, // Blue → Pink
	{ from: "#14B8A6", to: "#8B5CF6" }, // Teal → Purple
	{ from: "#F97316", to: "#3B82F6" }, // Orange → Blue
	{ from: "#22C55E", to: "#0EA5E9" }, // Green → Sky
	{ from: "#EC4899", to: "#6366F1" }, // Pink → Indigo
	{ from: "#6366F1", to: "#14B8A6" }, // Indigo → Teal
	{ from: "#F59E0B", to: "#EC4899" }, // Amber → Pink
	{ from: "#8B5CF6", to: "#F97316" }, // Violet → Orange
	{ from: "#0EA5E9", to: "#22C55E" }, // Sky → Green
	{ from: "#EF4444", to: "#8B5CF6" }, // Red → Violet
	{ from: "#06B6D4", to: "#EC4899" }, // Cyan → Pink
	{ from: "#10B981", to: "#6366F1" }, // Emerald → Indigo
	{ from: "#F43F5E", to: "#3B82F6" }, // Rose → Blue
	{ from: "#A855F7", to: "#06B6D4" }, // Purple → Cyan
	{ from: "#22C55E", to: "#EC4899" }, // Green → Pink
	{ from: "#EF4444", to: "#14B8A6" }, // Red → Teal
	{ from: "#3B82F6", to: "#F59E0B" }, // Blue → Amber
	{ from: "#EC4899", to: "#22C55E" }, // Pink → Green
	{ from: "#8B5CF6", to: "#10B981" }, // Violet → Emerald
	{ from: "#F97316", to: "#A855F7" }, // Orange → Purple
	{ from: "#06B6D4", to: "#F43F5E" }, // Cyan → Rose
	{ from: "#6366F1", to: "#EF4444" }, // Indigo → Red
	{ from: "#14B8A6", to: "#F97316" }, // Teal → Orange
	{ from: "#0EA5E9", to: "#EC4899" }, // Sky → Pink
	{ from: "#22C55E", to: "#8B5CF6" }, // Green → Violet
	{ from: "#F43F5E", to: "#06B6D4" }, // Rose → Cyan
	{ from: "#A855F7", to: "#22C55E" }, // Purple → Green
	{ from: "#EF4444", to: "#3B82F6" }, // Red → Blue
	{ from: "#10B981", to: "#EC4899" }, // Emerald → Pink
	{ from: "#F59E0B", to: "#6366F1" }, // Amber → Indigo
	{ from: "#0EA5E9", to: "#F43F5E" }, // Sky → Rose
	{ from: "#8B5CF6", to: "#14B8A6" }, // Violet → Teal
] as const;

/** Stable non-negative hash so the same name always maps to the same gradient. */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) - hash + str.charCodeAt(i);
		hash = hash & hash;
	}
	return Math.abs(hash);
}

/**
 * Deterministically pick an avatar gradient for a name. The same name always
 * yields the same pair, so a person's avatar looks identical across the app.
 *
 * @param name - The name to derive the gradient from.
 * @returns The chosen `{ from, to }` color pair.
 */
export function gradientForName(name?: string): { from: string; to: string } {
	const index = name ? hashString(name) % GRADIENT_PAIRS.length : 0;
	return GRADIENT_PAIRS[index] ?? GRADIENT_PAIRS[0];
}
