const isDev = process.env.NODE_ENV === "development";
const API_URL_DEV = "http://127.0.0.1:8080/";
const API_URL_PROD = "https://api.nvisy.com/";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	extends: ["@nvisy/console"],

	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	telemetry: { enabled: false },
	ssr: false, // SPA mode

	app: {
		head: {
			title: "Nvisy App",
			titleTemplate: "%s · Nvisy App",
			link: [
				{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
				{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
			],
		},
	},

	runtimeConfig: {
		public: {
			nvisyApiUrl: isDev ? API_URL_DEV : API_URL_PROD,
			nvisySdkLogging: isDev,
		},
	},

	// hooks: {
	//   "prerender:routes"({ routes }) {
	//     routes.clear();
	//   },
	// },

	nitro: {
		prerender: {
			crawlLinks: false,
			// ignore: ignoredNitroRoutes,
			routes: ["/"],
		},
	},

	modules: ["@nuxtjs/device", "@nuxtjs/i18n"],

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
