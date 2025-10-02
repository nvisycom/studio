import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@astrojs/vue';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

// TODO: Replace Eslint & Prettier with Biome.
// BLOCKER: https://github.com/biomejs/biome/discussions/136
// BLOCKER: https://github.com/biomejs/biome/discussions/1254

const srcImport = new URL("./src", import.meta.url);
const srcPath = fileURLToPath(srcImport);

// https://astro.build/config
export default defineConfig({
 	site: "https://nvisy.com",
	srcDir: "./src",
  integrations: [vue({ devtools: true }), mdx(), sitemap()],

 	markdown: {
		shikiConfig: {
			theme: "github-light-default",
			transformers: [],
		},
	},

	vite: {
		plugins: [tailwindcss()],
		resolve: { alias: { "@": srcPath } },
	},
});
