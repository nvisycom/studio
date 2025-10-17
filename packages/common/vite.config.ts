import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
		dts({
			include: ["src/**/*.ts", "src/**/*.vue"],
			exclude: ["src/**/*.test.ts", "src/**/*.spec.ts"],
			outDir: "dist",
			copyDtsFiles: true,
			insertTypesEntry: true,
		}),
	],

	build: {
		lib: {
			entry: {
				index: resolve(__dirname, "src/index.ts"),
				components: resolve(__dirname, "src/components/index.ts"),
				composables: resolve(__dirname, "src/composables/index.ts"),
				utils: resolve(__dirname, "src/utils/index.ts"),
			},
			name: "NvisyUI",
			formats: ["es"],
		},

		cssCodeSplit: false,

		rollupOptions: {
			// Make sure to externalize deps that shouldn't be bundled
			external: [
				"vue",
				"@vue/shared",
				"@vue/runtime-core",
				"@vue/runtime-dom",
				"@vue/reactivity",
			],

			output: {
				// Provide global variables to use in the UMD build
				globals: {
					vue: "Vue",
				},
			},
		},

		sourcemap: true,
		emptyOutDir: true,
		outDir: "dist",
		minify: false,
		target: "es2020",
	},

	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@/components": resolve(__dirname, "src/components"),
			"@/utils": resolve(__dirname, "src/utils"),
		},
	},

	// CSS handling
	css: {
		modules: false,
	},

	// Development server (if needed for testing)
	server: {
		port: 3001,
		host: true,
	},
});
