/** Calculates the reading time of a text in minutes. */
export function calculateReadingTime(text: string): number {
	const wordsPerMinute = 238;
	const words = text.split(/\s+/).length;
	return Math.max(Math.ceil(words / wordsPerMinute), 1);
}

/** Converts a full name to initials (e.g., "John Doe" -> "JD"). */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("")
		.slice(0, 2);
}
