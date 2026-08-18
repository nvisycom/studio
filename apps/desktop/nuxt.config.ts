// Tauri desktop shell — extends the shared @nvisy/console layer.
// Static SPA output is wrapped by the Tauri Rust shell in tauri/.
// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV === "development";
const API_URL_DEV = "http://127.0.0.1:8080/";
const API_URL_PROD = "https://api.nvisy.com/";

export default defineNuxtConfig({
	extends: ["@nvisy/console"],

	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	telemetry: { enabled: false },
	ssr: false, // SPA mode — required for Tauri

	// Tauri serves the frontend over a fixed dev server port and expects a
	// fully static, relative-path build.
	devServer: { host: "127.0.0.1", port: 1420 },
	app: { baseURL: "./" },

	runtimeConfig: {
		public: {
			nvisyApiUrl: isDev ? API_URL_DEV : API_URL_PROD,
			nvisySdkLogging: isDev,
			// The desktop origin is `tauri://`, so user-facing links (invite links)
			// must point at the hosted web app instead of the current origin.
			webAppUrl: "https://app.nvisy.com",
			// Desktop is a self-hosted-style edition (no cloud-only billing/OAuth).
			deployment: process.env.NUXT_PUBLIC_DEPLOYMENT ?? "self-hosted",
		},
	},

	nitro: {
		// Tauri bundles the static output; no server runtime.
		preset: "static",
	},

	// Re-declare the locales so @nuxtjs/i18n globs this layer's own
	// `i18n/locales/*.json` too and merges them into the base @nvisy/console
	// catalog — that's where the desktop-only `tray.*` keys live.
	i18n: {
		locales: [
			{ code: "en", name: "English", file: "en.json" },
			{ code: "de", name: "Deutsch", file: "de.json" },
		],
	},
});
