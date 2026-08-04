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
