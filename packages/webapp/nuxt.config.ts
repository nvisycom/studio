import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	telemetry: { enabled: false },

	css: ["~/assets/css/fonts.css", "~/assets/css/tailwind.css"],

	modules: [
		"shadcn-nuxt",
		"@pinia/colada-nuxt",
		"@pinia/nuxt",
		"@nuxtjs/color-mode",
		"@nuxtjs/device",
		"@nuxtjs/seo",
		"@nuxtjs/sitemap",
		"@nuxtjs/robots",
		"@nuxtjs/i18n",
		"nuxt-og-image",
		"nuxt-schema-org",
	],

	vite: {
		plugins: [tailwindcss()],
	},

	colorMode: {
		classSuffix: "",
		storage: "cookie",
		preference: "system",
		fallback: "light",
	},

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
});
