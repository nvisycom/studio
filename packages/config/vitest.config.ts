import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

const importUrl = new URL("./src", import.meta.url);
const srcDir = fileURLToPath(importUrl);

export default defineConfig({
	test: {
		globals: true,
	},
	resolve: {
		alias: {
			"@": srcDir,
		},
	},
});
