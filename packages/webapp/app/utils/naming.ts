/**
 * Get initials from a name.
 *
 * @param name - The name to get initials from.
 * @returns The initials of the name.
 */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
}
