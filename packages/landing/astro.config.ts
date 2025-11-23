import { fileURLToPath, URL } from "node:url";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import vueDevTools from "vite-plugin-vue-devtools";

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

	i18n: {
		locales: ["en", "de", "fr"],
		defaultLocale: "en",
		fallback: {
			de: "en",
			fr: "en",
		},
	},

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
