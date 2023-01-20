import ViteComponents from "unplugin-vue-components/vite";
import { HeadlessUiResolver } from "unplugin-vue-components/resolvers";
import svgLoader from "vite-svg-loader";

const meta = {
  title: "Avocado",
  description:
    "The multi-network gas and account abstraction allowing you to experience web3 more seamlessly.",
  image:
    "https://user-images.githubusercontent.com/45617686/211059835-0ecbb1b9-f448-4bed-9c52-a9359c67cbe6.png",
};

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      googleAnalyticsId: process.env.GA_ID,
      avocadoChainId: 634,
    },
  },
  app: {
    head: {
      title: meta.title,
      meta: [
        {
          name: "viewport",
          content: "false",
        },
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
          content: "https://avocado.link",
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
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "@instadapp/vue-web3-nuxt",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    [
      "unplugin-vue-inspector/nuxt",
      {
        enabled: false,
        toggleButtonVisibility: "never",
      },
    ],
  ],
  colorMode: {
    preference: "dark",
    classSuffix: "",
  },
  css: [
    "@fontsource/source-code-pro/400.css",
    "@fontsource/source-code-pro/500.css",
    "@fontsource/source-code-pro/600.css",
    "~/assets/css/app.css",
  ],

  imports: {
    dirs: ["./stores"],
  },

  routeRules: {
    '/site.webmanifest': {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    },
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
