// Tauri desktop shell — extends the shared @nvisy/console layer.
// Static SPA output is wrapped by the Tauri Rust shell in tauri/.
// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV === "development";
const API_URL_DEV = "http://127.0.0.1:8080/";
const API_URL_PROD = "https://api.nvisy.com/";

// The default server the app connects to. Always the hosted API, so every build
// points at production out of the box. To develop against a local server, set
// `NVISY_DEV=1` (or point `NUXT_PUBLIC_NVISY_API_URL` straight at any URL) — the
// dev default is opt-in, never the silent fallback of a dev build.
const devServerFlag =
	process.env.NVISY_DEV === "1" || process.env.NVISY_DEV === "true";
const defaultApiUrl = devServerFlag ? API_URL_DEV : API_URL_PROD;

export default defineNuxtConfig({
	extends: ["@nvisy/console"],

	compatibilityDate: "2025-07-15",
	// The desktop app is a product shell, not a browser dev surface — the
	// DevTools toolbar overlays the (chromeless) spotlight window and its own
	// routes fall through to our 404. Keep it off.
	devtools: { enabled: false },
	telemetry: { enabled: false },
	ssr: false, // SPA mode — required for Tauri

	// Tauri serves the frontend over a fixed dev server port and expects a
	// fully static, relative-path build.
	devServer: { host: "127.0.0.1", port: 1420 },
	// Favicon links are inherited from the shared layer; the title names the dev
	// shell tab (the packaged window uses the Rust-side window title instead).
	app: {
		baseURL: "./",
		head: {
			title: "Nvisy",
			titleTemplate: "%s · Nvisy",
		},
	},

	runtimeConfig: {
		public: {
			nvisyApiUrl: defaultApiUrl,
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
