import tailwindcss from "@tailwindcss/vite";

const isDev = process.env.NODE_ENV === "development";
const API_URL_DEV = "http://127.0.0.1:8080/";
const API_URL_PROD = "https://api.nvisy.com/";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  telemetry: { enabled: false },
  ssr: false, // SPA mode

  runtimeConfig: {
    public: {
      nvisyApiUrl: isDev ? API_URL_DEV : API_URL_PROD,
      nvisySdkLogging: isDev,
    },
  },

  // hooks: {
  //   "prerender:routes"({ routes }) {
  //     routes.clear();
  //   },
  // },

  nitro: {
    prerender: {
      crawlLinks: false,
      // ignore: ignoredNitroRoutes,
      routes: ["/"],
    },
  },

  css: ["~/assets/css/fonts.css", "~/assets/css/tailwind.css"],

  modules: [
    "shadcn-nuxt",
    "@pinia/colada-nuxt",
    "@pinia/nuxt",
    "@nuxtjs/color-mode",
    "@nuxtjs/device",
    "@nuxtjs/i18n",
  ],

  vite: {
    plugins: [tailwindcss()],
  },

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
