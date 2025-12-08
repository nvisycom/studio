import { describe, expect, it } from "vitest";
import { MAX_INITIALS_LENGTH, WORDS_PER_MINUTE } from "./constants";

describe("constants", () => {
  it("should export WORDS_PER_MINUTE", () => {
    expect(WORDS_PER_MINUTE).toBe(238);
  });

  it("should export MAX_INITIALS_LENGTH", () => {
    expect(MAX_INITIALS_LENGTH).toBe(2);
  });
});
