import { provideSSRWidth } from "@vueuse/core";

/**
 * Provides the SSR width for the application.
 *
 * Required for shadcn-vue to work properly.
 *
 * https://www.shadcn-vue.com/docs/installation/nuxt
 */
export default defineNuxtPlugin((nuxtApp) => {
	provideSSRWidth(1024, nuxtApp.vueApp);
});
