import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	entry: ["src/index.ts"],
	sourcemap: true,
	dts: true,

	format: "esm",
	platform: "neutral",
});
