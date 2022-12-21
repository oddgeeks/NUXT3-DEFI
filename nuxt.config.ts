import ViteComponents from "unplugin-vue-components/vite";
import { HeadlessUiResolver } from "unplugin-vue-components/resolvers";
import svgLoader from "vite-svg-loader";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/tokenlist.json']
    }
  },

  modules: [
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "@instadapp/vue-web3-nuxt",
    "@vueuse/nuxt",
    "@pinia/nuxt",
  ],

  css: [
    "@fontsource/source-code-pro/400.css",
    "@fontsource/source-code-pro/500.css",
    "@fontsource/source-code-pro/600.css",
    "~/assets/css/app.css",
  ],

  imports: {
    dirs: ["./stores"],
  },

  vite: {
    plugins: [
      ViteComponents({
        dts: true,
        resolvers: [HeadlessUiResolver({})],
      }),
      svgLoader({
        svgoConfig: {
          plugins: ["prefixIds"],
        },
      }),
    ],
  },
});
