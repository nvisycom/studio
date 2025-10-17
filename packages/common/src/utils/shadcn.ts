import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge multiple class names into a single string.
 *
 * @param inputs - The class names to merge.
 * @returns The merged class names.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
