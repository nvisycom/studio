import { describe, expect, it } from "vitest";
import { calculateReadingTime, getInitials } from "./utilities";

describe("calculateReadingTime", () => {
  it("should calculate reading time for a short text", () => {
    const text = "Hello world";
    const result = calculateReadingTime(text);
    expect(result).toBe(1);
  });

  it("should calculate reading time for a longer text", () => {
    const text = "Lorem ipsum ".repeat(238); // 477 words (trailing space adds 1)
    const result = calculateReadingTime(text);
    expect(result).toBe(3); // ceil(477/238) = 3
  });

  it("should calculate reading time for multiple minutes", () => {
    const text = "Lorem ipsum ".repeat(500); // 1000 words (2 words * 500)
    const result = calculateReadingTime(text);
    expect(result).toBe(5); // ceil(1000/238) = 5
  });

  it("should return at least 1 minute for very short text", () => {
    const text = "Hi";
    const result = calculateReadingTime(text);
    expect(result).toBe(1);
  });

  it("should handle empty string", () => {
    const text = "";
    const result = calculateReadingTime(text);
    expect(result).toBe(1);
  });
});

describe("getInitials", () => {
  it("should return initials for a full name", () => {
    const result = getInitials("John Doe");
    expect(result).toBe("JD");
  });

  it("should return initials for a single name", () => {
    const result = getInitials("John");
    expect(result).toBe("J"); // single word = single initial
  });

  it("should return only first two initials for multiple names", () => {
    const result = getInitials("John Michael Doe");
    expect(result).toBe("JM");
  });

  it("should handle lowercase names", () => {
    const result = getInitials("john doe");
    expect(result).toBe("JD");
  });

  it("should handle single character names", () => {
    const result = getInitials("A B");
    expect(result).toBe("AB");
  });
});
