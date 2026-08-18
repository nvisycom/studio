// Tauri desktop shell — extends the shared @nvisy/console layer.
// Static SPA output is wrapped by the Tauri Rust shell in tauri/.
// https://nuxt.com/docs/api/configuration/nuxt-config
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
