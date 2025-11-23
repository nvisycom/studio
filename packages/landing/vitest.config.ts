import { fileURLToPath, URL } from "node:url";
import { getViteConfig } from "astro/config";
import { configDefaults } from "vitest/config";

export default getViteConfig({
	test: {
		environment: "jsdom",
		exclude: [...configDefaults.exclude, "e2e/**"],
		root: fileURLToPath(new URL("./", import.meta.url)),
	},
});
