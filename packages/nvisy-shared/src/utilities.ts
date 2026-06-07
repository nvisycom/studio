import { MAX_INITIALS_LENGTH, WORDS_PER_MINUTE } from "./constants";

/** Calculates the reading time of a text in minutes. */
export function calculateReadingTime(text: string): number {
	const words = text.split(/\s+/).length;
	return Math.max(Math.ceil(words / WORDS_PER_MINUTE), 1);
}

/** Converts a full name to initials (e.g., "John Doe" -> "JD"). */
export function getInitials(name: string): string {
	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase())
		.join("")
		.slice(0, MAX_INITIALS_LENGTH);
}
