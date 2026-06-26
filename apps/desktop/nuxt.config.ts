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
});
