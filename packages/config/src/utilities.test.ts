import { describe, expect, it } from "vitest";
import * as utilities from "@/utilities.ts";

describe("utilities", () => {
  it("should re-export", () => {
    expect(utilities).toBeTruthy();
  });
});
