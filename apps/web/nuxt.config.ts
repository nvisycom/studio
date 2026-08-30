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
			title: "Nvisy",
			titleTemplate: "%s · Nvisy",
			// Favicon links come from the shared layer (see its nuxt.config).
		},
	},

	runtimeConfig: {
		public: {
			nvisyApiUrl: isDev ? API_URL_DEV : API_URL_PROD,
			nvisySdkLogging: isDev,
			// Base URL of the web app for user-facing links (e.g. invite links).
			// Empty on web — the current origin is already the web app.
			webAppUrl: "",
			// Deployment edition. "cloud" enables SaaS-only features (billing,
			// OAuth, support chat); anything else is treated as self-hosted. Cloud
			// builds set NUXT_PUBLIC_DEPLOYMENT=cloud; self-hosted leaves it unset.
			deployment: process.env.NUXT_PUBLIC_DEPLOYMENT ?? "self-hosted",
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

	modules: ["@nuxtjs/device"],
});
