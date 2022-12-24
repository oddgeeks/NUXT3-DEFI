import ViteComponents from "unplugin-vue-components/vite";
import { HeadlessUiResolver } from "unplugin-vue-components/resolvers";
import svgLoader from "vite-svg-loader";

const meta = {
  title: "Avocado",
  description:
    "The platform that makes web3 interaction easy by enabling network, gas and account abstraction allowing you to experience web3 more seamlessly.",
  image:
    "https://user-images.githubusercontent.com/45617686/209450128-8fa64c0e-b141-42e4-9e58-6f25b214a94f.png",
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: meta.title,
      meta: [
        {
          name: "title",
          content: meta.title,
        },
        {
          name: "description",
          content: meta.description,
        },
        {
          property: "og:title",
          content: meta.title,
        },
        {
          property: "og:description",
          content: meta.description,
        },
        {
          property: "og:url",
          content: "https://avocado.instadapp.io",
        },
        {
          property: "og:image",
          content: meta.image,
        },
        {
          name: "twitter:site",
          content: "@instadapp",
        },
        {
          name: "twitter:title",
          content: meta.title,
        },
        {
          name: "twitter:description",
          content: meta.description,
        },
        {
          name: "twitter:image",
          content: meta.image,
        },
        {
          name: "twitter:image_alt",
          content: meta.description,
        },
        {
          name: "twitter:card",
          content: "summary",
        },
      ],
      link: [
        {
          rel: "shortcut icon",
          type: "image/x-icon",
          href: "/icons/favicon.ico",
        },
        {
          rel: "apple-touch-icon",
          href: "/icons/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/icons/android-chrome-192x192.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "512x512",
          href: "/icons/android-chrome-512x512.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/icons/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/icons/favicon-16x16.png",
        },
        {
          rel: "manifest",
          href: "/site.webmanifest",
        },
      ],
    },
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
