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
