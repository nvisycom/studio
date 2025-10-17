// Import styles for CSS extraction
import "./styles.css";

// Re-export all components
export * from "./components";
// Re-export all composables
export * from "./composables";
// Re-export all utils
export * from "./utils";

// Vue plugin for global installation
import type { App } from "vue";
import OpenStatus from "./components/OpenStatus.vue";

const components = {
	OpenStatus,
};

export default {
	install(app: App) {
		Object.entries(components).forEach(([name, component]) => {
			app.component(name, component);
		});
	},
};

// Export components object for convenience
export const SharedComponents = components;
