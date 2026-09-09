const isDev = process.env.NODE_ENV === "development";
// In dev the browser reaches the API *same-origin* through the `/api` proxy
// below (so cookie auth works: SameSite cookies ride first-party requests and
// the SPA can read the CSRF cookie); the proxy forwards to this upstream.
const API_UPSTREAM_DEV = "http://127.0.0.1:8080";
const API_URL_DEV = "/api/";
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
			// Fallback title before a page sets its own. The titleTemplate (a function,
			// so it lives in app.vue — nuxt.config head must be serializable) turns a
			// missing or "Nvisy" title into plain "Nvisy" rather than "Nvisy · Nvisy".
			title: "Nvisy",
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
			// Dropbox Chooser app key (a public, domain-restricted client id — safe
			// to expose). Enables the Dropbox import picker; blank disables it. Set
			// via NUXT_PUBLIC_DROPBOX_APP_KEY.
			dropboxAppKey: "",
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
		// Dev-only: proxy `/api/**` to the local API so the browser talks to it
		// same-origin (required for cookie auth). The `/api` prefix is stripped by
		// the `**` capture, so `/api/account/` reaches the upstream as `/account/`.
		// Prod points at the real API host directly (API_URL_PROD), no proxy there.
		...(isDev && {
			routeRules: {
				"/api/**": { proxy: `${API_UPSTREAM_DEV}/**` },
			},
		}),
	},

	modules: ["@nuxtjs/device"],
});
