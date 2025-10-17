import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
		tsconfigPaths(),
		dts({
			insertTypesEntry: true,
			include: ["src/**/*.ts", "src/**/*.vue"],
			exclude: ["src/main.ts", "src/App.vue"],
			staticImport: true,
		}),
	],
	build: {
		lib: {
			entry: {
				index: resolve(__dirname, "src/index.ts"),
				"components/index": resolve(__dirname, "src/components/index.ts"),
				"composables/index": resolve(__dirname, "src/composables/index.ts"),
				"utils/index": resolve(__dirname, "src/utils/index.ts"),
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: [
				"vue",
				"class-variance-authority",
				"clsx",
				"tailwind-merge",
				"lucide-vue-next",
				"pinia",
				"@pinia/colada",
			],
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "chunks/[name]-[hash].js",
				assetFileNames: (assetInfo) => {
					if (assetInfo.name?.endsWith(".css")) {
						return "styles.css";
					}
					return "assets/[name]-[hash][extname]";
				},
			},
		},
		sourcemap: true,
		cssCodeSplit: false,
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
