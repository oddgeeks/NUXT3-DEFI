import ViteComponents from 'unplugin-vue-components/vite'
import { HeadlessUiResolver } from 'unplugin-vue-components/resolvers'

const meta = {
  title: 'Avocado',
  description:
    'The web3 superwallet - making your web3 interactions much simpler & safer',
  image: 'https://avocado.instadapp.io/logo.png',
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@instadapp/avocado-base'],

  runtimeConfig: {
    socketApiKey: process.env.SOCKET_API_KEY,
    debankAccessKey: process.env.DEBANK_ACCESS_KEY,
    ankrApiKey: process.env.ANKR_API_KEY,
    slackKey: process.env.SLACK_KEY,
    slackErrorKey: process.env.SLACK_ERROR_KEY,
    slackStagingKey: process.env.SLACK_STAGING_KEY,
    public: {
      googleAnalyticsId: process.env.GA_ID,
    },
  },
  nitro: {
    routeRules: {
      '/api/cross-chain/estimate': {
        proxy: 'https://microservices.instadapp.io/api/avocado/cross-chain/estimate',
      },
      '/**': {
        headers: {
          'Content-Security-Policy': 'frame-ancestors \'none\'',
        },
      },
      '/tokenlist.json': {
        cors: true,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: { maxAge: 86400 },
      },
      // "/api/**": { cache: { maxAge: 5 } },
      // "/api/transfers": { cache: { maxAge: 20 } },
      // "/api/tokens": {
      //   cache: {
      //     maxAge: 3600, // 1 hour
      //   },
      // },
    },
  },
  pwa: {
    registerType: 'prompt',
    manifestFilename: 'site.webmanifest',
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    client: {
      // if enabling periodic sync for update use 1 hour or so (periodicSyncForUpdates: 3600)
      periodicSyncForUpdates: 20,
    },
  },
  app: {
    head: {
      title: meta.title,
      meta: [
        {
          name: 'title',
          content: meta.title,
        },
        {
          name: 'theme-color',
          content: 'transparent',
        },
        {
          name: 'description',
          content: meta.description,
        },
        {
          property: 'og:title',
          content: meta.title,
        },
        {
          property: 'og:description',
          content: meta.description,
        },
        {
          property: 'og:url',
          content: 'https://avocado.instadapp.io',
        },
        {
          property: 'og:image',
          content: meta.image,
        },
        {
          name: 'twitter:site',
          content: '@instadapp',
        },
        {
          name: 'twitter:title',
          content: meta.title,
        },
        {
          name: 'twitter:description',
          content: meta.description,
        },
        {
          name: 'twitter:image',
          content: meta.image,
        },
        {
          name: 'twitter:image_alt',
          content: meta.description,
        },
        {
          name: 'twitter:card',
          content: 'summary',
        },
      ],
      link: [
        {
          rel: 'shortcut icon',
          type: 'image/x-icon',
          href: '/icons/favicon.ico',
        },
        {
          rel: 'apple-touch-icon',
          href: '/icons/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/icons/android-chrome-192x192.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '512x512',
          href: '/icons/android-chrome-512x512.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/icons/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/icons/favicon-16x16.png',
        },
        {
          rel: 'manifest',
          href: '/site.webmanifest',
        },
      ],
    },
  },
  svgo: {
    defaultImport: 'component',
    autoImportPath: './assets/images/icons',
    svgoConfig: {
      plugins: ['prefixIds'],
    },
  },
  modules: [
    '@vite-pwa/nuxt',
    'nuxt-svgo',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    '@instadapp/vue-web3-nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    [
      'unplugin-vue-inspector/nuxt',
      {
        enabled: false,
        toggleButtonVisibility: 'never',
      },
    ],
  ],

  colorMode: {
    preference: 'dark',
    classSuffix: '',
  },
  css: [
    '@fontsource/source-code-pro/400.css',
    '@fontsource/source-code-pro/500.css',
    '@fontsource/source-code-pro/600.css',
    '~/assets/css/app.css',
  ],
  pinia: {
    autoImports: [
      'storeToRefs',
      'defineStore',
      'acceptHMRUpdate',
    ],
  },
  imports: {
    dirs: ['./stores'],
  },

  routeRules: {
    '/site.webmanifest': {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    },
  },

  vite: {
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
    plugins: [
      ViteComponents({
        dts: true,
        resolvers: [HeadlessUiResolver({})],
      }),
    ],
  },
  experimental: {
    // emitRouteChunkError: "reload",
  },
})
