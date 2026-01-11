import { describe, expect, it } from "vitest";
import * as shared from "./index";

describe("index exports", () => {
  it("should export calculateReadingTime", () => {
    expect(shared.calculateReadingTime).toBeDefined();
    expect(typeof shared.calculateReadingTime).toBe("function");
  });

  it("should export getInitials", () => {
    expect(shared.getInitials).toBeDefined();
    expect(typeof shared.getInitials).toBe("function");
  });
});
