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

	// Brand favicon shipped by the layer (from its `public/`, merged into every
	// app) so web and the desktop dev shell share one source of truth. The flat,
	// solid-fill SVG is the primary; the multi-size .ico is the raster fallback
	// for engines that skip SVG favicons.
	app: {
		head: {
			link: [
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
			],
		},
	},

	css: [
		`${layerDir}app/assets/css/fonts.css`,
		`${layerDir}app/assets/css/tailwind.css`,
		`${layerDir}app/assets/css/entities.css`,
	],

	modules: [
		"@nuxtjs/color-mode",
		"@pinia/nuxt",
		"@pinia/colada-nuxt",
		"@nuxtjs/i18n",
	],

	// Register the shadcn-vue design system from the layer ourselves, following
	// github.com/unovue/shadcn-vue-nuxt-layer).
	// The `extensions: ['.vue']` is required so Nuxt does not also auto-import each
	// dir's `index.ts` barrel, which would resolve to the same `Ui*` name and warn.
	// We drop the `shadcn-nuxt` module: it resolves `componentDir` against the consuming
	// app's root (not the layer), so it can't see these components.
	components: [
		{
			path: `${layerDir}app/components/ui`,
			extensions: [".vue"],
			prefix: "Ui",
		},
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
