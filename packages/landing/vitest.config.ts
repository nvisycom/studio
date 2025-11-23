import { configDefaults } from "vitest/config";
import { getViteConfig } from "astro/config";
import { fileURLToPath, URL } from "node:url";

export default getViteConfig({
	test: {
		environment: "jsdom",
		exclude: [...configDefaults.exclude, "e2e/**"],
		root: fileURLToPath(new URL("./", import.meta.url)),
	},
});
