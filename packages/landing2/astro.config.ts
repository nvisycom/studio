import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";

import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

const srcImport = new URL("./src", import.meta.url);
const srcPath = fileURLToPath(srcImport);

// TODO: Replace Eslint & Prettier with Biome.
// BLOCKER: https://github.com/biomejs/biome/discussions/136
// BLOCKER: https://github.com/biomejs/biome/discussions/1254

// https://astro.build/config
export default defineConfig({
	site: "https://nvisy.com",
	srcDir: "./src",
	integrations: [mdx(), sitemap(), vue()],

	markdown: {
		shikiConfig: {
			theme: "github-light-default",
			transformers: [],
		},
	},

	vite: {
		plugins: [vueDevTools(), tailwindcss()],
		resolve: { alias: { "@": srcPath } },
	},
});
