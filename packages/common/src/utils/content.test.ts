import { describe, expect, it } from "vitest";
import { calculateReadingTime } from "./content";

describe("calculateReadingTime", () => {
	it("should return minimum of 1 minute for empty or very short content", () => {
		expect(calculateReadingTime("")).toBe(1);
		expect(calculateReadingTime("Hello")).toBe(1);
		expect(calculateReadingTime("Hello world")).toBe(1);
	});

	it("should calculate reading time based on 238 words per minute", () => {
		// Exactly 238 words should be 1 minute
		const words238 = Array(238).fill("word").join(" ");
		expect(calculateReadingTime(words238)).toBe(1);

		// 239 words should be 2 minutes (rounded up)
		const words239 = Array(239).fill("word").join(" ");
		expect(calculateReadingTime(words239)).toBe(2);

		// 476 words should be 2 minutes
		const words476 = Array(476).fill("word").join(" ");
		expect(calculateReadingTime(words476)).toBe(2);
	});

	it("should handle realistic blog post content", () => {
		const shortPost = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
      tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
      veniam, quis nostrud exercitation ullamco laboris.
    `;
		expect(calculateReadingTime(shortPost)).toBe(1);

		// Medium post with approximately 500 words (should be ~3 minutes)
		const mediumPost = Array(500).fill("word").join(" ");
		expect(calculateReadingTime(mediumPost)).toBe(3);
	});

	it("should round up partial minutes", () => {
		// 357 words (238 * 1.5) should round up to 2 minutes
		const words357 = Array(357).fill("word").join(" ");
		expect(calculateReadingTime(words357)).toBe(2);
	});
});
