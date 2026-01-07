import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: { enabled: false },
  ssr: false,

  css: ["~/assets/fonts.css", "~/assets/tailwind.css"],
  modules: [
    "@nuxt/devtools",
    "@nuxt/image",
    "@nuxtjs/i18n",
    "@nuxtjs/color-mode",
    "@nuxtjs/device",
    "@pinia/nuxt",
    "@pinia/colada-nuxt",
    "shadcn-nuxt",
  ],

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
    plugins: [tailwindcss()],
  },

  // Avoids [unhandledRejection] EMFILE: too many open files
  ignore: ["**/src-tauri/**"],

  colorMode: {
    classSuffix: "",
    storage: "cookie",
    preference: "system",
    fallback: "light",
  },

  i18n: {
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      redirectOn: "root",
    },

    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "de", name: "Deutsch", file: "de.json" },
    ],
    defaultLocale: "en",

    compilation: {
      strictMessage: true,
      escapeHtml: true,
    },
  },
});
