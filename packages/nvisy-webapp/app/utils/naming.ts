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
