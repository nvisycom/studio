// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	ssr: false,

	devServer: {
		// Enables the development server to be discoverable by other devices
		// when running on iOS physical devices
		host: "0.0.0.0",
	},

	vite: {
		// Better support for Tauri CLI output
		clearScreen: false,
		// Additional environment variables can be found at
		// https://v2.tauri.app/reference/environment-variables/
		envPrefix: ["VITE_", "TAURI_"],
		server: {
			// Tauri requires a consistent port
			strictPort: true,
		},
	},

	// Avoids [unhandledRejection] EMFILE: too many open files
	ignore: ["**/src-tauri/**"],
});
