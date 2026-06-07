import { describe, expect, it } from "vitest";
import * as index from "@/index.ts";

describe("index", () => {
	it("should re-export", () => {
		expect(index).toBeTruthy();
	});
});
