import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const layerDir = fileURLToPath(new URL(".", import.meta.url));

// Nuxt layer: @nvisy/console
// Shared design system, feature components, composables, and data layer
// consumed by apps/web and apps/desktop via `extends`.
// https://nuxt.com/docs/getting-started/layers
export default defineNuxtConfig({
	// `#console` resolves to this layer's srcDir in every consuming app, so the
	// shared design system is imported explicitly (shadcn-vue convention) while
	// each app's own `@/` keeps pointing at its own files.
	alias: {
		"#console": `${layerDir}app`,
	},

	css: [
		`${layerDir}app/assets/css/fonts.css`,
		`${layerDir}app/assets/css/tailwind.css`,
	],

	modules: [
		"shadcn-nuxt",
		"@nuxtjs/color-mode",
		"@pinia/nuxt",
		"@pinia/colada-nuxt",
		"@nuxtjs/i18n",
	],

	i18n: {
		strategy: "no_prefix",
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: "i18n_redirected",
			redirectOn: "root",
		},

		locales: [
			{ code: "en", name: "English", file: "en.json" },
			{ code: "de", name: "Deutsch", file: "de.json" },
		],
		defaultLocale: "en",

		compilation: {
			strictMessage: true,
			escapeHtml: true,
		},
	},

	vite: {
		plugins: [tailwindcss()],
	},

	colorMode: {
		classSuffix: "",
		storage: "cookie",
		preference: "system",
		fallback: "light",
	},
});
