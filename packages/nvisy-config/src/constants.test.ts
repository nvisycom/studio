import { describe, expect, it } from "vitest";
import * as constant from "@/constants.ts";

describe("constant", () => {
  it("should export constants", () => {
    expect(constant).toBeTruthy();
  });
});
