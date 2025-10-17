import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	plugins: [vue()],

	test: {
		globals: true,
		environment: "happy-dom",
		include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
		exclude: ["node_modules", "dist", "**/*.d.ts"],

		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"dist/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/index.ts",
			],
		},
	},

	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
