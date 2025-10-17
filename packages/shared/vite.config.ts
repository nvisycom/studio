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
			exclude: [
				"src/main.ts",
				"src/App.vue",
				// "src/components/ui/stepper/*.vue",
				// "src/components/ui/toggle-group/*.vue",
				// "src/components/ui/toggle/*.vue"
			],
			staticImport: true,
			rollupTypes: true,
		}),
	],
	build: {
		lib: {
			entry: {
				index: resolve(__dirname, "src/index.ts"),
				"components/index": resolve(__dirname, "src/components/index.ts"),
				"composables/index": resolve(__dirname, "src/composables/index.ts"),
				"utils/index": resolve(__dirname, "src/utils/index.ts"),
				// Individual UI components
				"ui/accordion": resolve(__dirname, "src/components/ui/accordion/index.ts"),
				"ui/alert": resolve(__dirname, "src/components/ui/alert/index.ts"),
				"ui/alert-dialog": resolve(__dirname, "src/components/ui/alert-dialog/index.ts"),
				"ui/aspect-ratio": resolve(__dirname, "src/components/ui/aspect-ratio/index.ts"),
				"ui/avatar": resolve(__dirname, "src/components/ui/avatar/index.ts"),
				"ui/badge": resolve(__dirname, "src/components/ui/badge/index.ts"),
				"ui/breadcrumb": resolve(__dirname, "src/components/ui/breadcrumb/index.ts"),
				"ui/button": resolve(__dirname, "src/components/ui/button/index.ts"),
				"ui/button-group": resolve(__dirname, "src/components/ui/button-group/index.ts"),
				"ui/calendar": resolve(__dirname, "src/components/ui/calendar/index.ts"),
				"ui/card": resolve(__dirname, "src/components/ui/card/index.ts"),
				"ui/checkbox": resolve(__dirname, "src/components/ui/checkbox/index.ts"),
				"ui/collapsible": resolve(__dirname, "src/components/ui/collapsible/index.ts"),
				"ui/command": resolve(__dirname, "src/components/ui/command/index.ts"),
				"ui/dialog": resolve(__dirname, "src/components/ui/dialog/index.ts"),
				"ui/dropdown-menu": resolve(__dirname, "src/components/ui/dropdown-menu/index.ts"),
				"ui/empty": resolve(__dirname, "src/components/ui/empty/index.ts"),
				"ui/input": resolve(__dirname, "src/components/ui/input/index.ts"),
				"ui/input-group": resolve(__dirname, "src/components/ui/input-group/index.ts"),
				"ui/kbd": resolve(__dirname, "src/components/ui/kbd/index.ts"),
				"ui/label": resolve(__dirname, "src/components/ui/label/index.ts"),
				"ui/progress": resolve(__dirname, "src/components/ui/progress/index.ts"),
				"ui/radio-group": resolve(__dirname, "src/components/ui/radio-group/index.ts"),
				"ui/select": resolve(__dirname, "src/components/ui/select/index.ts"),
				"ui/separator": resolve(__dirname, "src/components/ui/separator/index.ts"),
				"ui/sheet": resolve(__dirname, "src/components/ui/sheet/index.ts"),
				"ui/sidebar": resolve(__dirname, "src/components/ui/sidebar/index.ts"),
				"ui/skeleton": resolve(__dirname, "src/components/ui/skeleton/index.ts"),
				"ui/slider": resolve(__dirname, "src/components/ui/slider/index.ts"),
				"ui/sonner": resolve(__dirname, "src/components/ui/sonner/index.ts"),
				"ui/table": resolve(__dirname, "src/components/ui/table/index.ts"),
				"ui/tabs": resolve(__dirname, "src/components/ui/tabs/index.ts"),
				"ui/textarea": resolve(__dirname, "src/components/ui/textarea/index.ts"),
				"ui/tooltip": resolve(__dirname, "src/components/ui/tooltip/index.ts"),
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
