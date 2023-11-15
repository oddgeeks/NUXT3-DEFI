import ViteComponents from 'unplugin-vue-components/vite'
import { HeadlessUiResolver } from 'unplugin-vue-components/resolvers'

const meta = {
  title: 'Avocado',
  description:
    'The web3 superwallet - making your web3 interactions much simpler & safer',
  image: 'https://avocado-git-logo-update-v2-instadapp-eng.vercel.app/logo.png',
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['@instadapp/avocado-base'],
  vue: {
    defineModel: true,
    propsDestructure: true,
  },
  devtools: false,
  runtimeConfig: {
    socketApiKey: process.env.SOCKET_API_KEY,
    debankAccessKey: process.env.DEBANK_ACCESS_KEY,
    ankrApiKey: process.env.ANKR_API_KEY,
    slackKey: process.env.SLACK_KEY,
    slackErrorKey: process.env.SLACK_ERROR_KEY,
    slackBridgeErrorKey: process.env.SLACK_BRIDGE_ERROR_KEY,
    slackStagingKey: process.env.SLACK_STAGING_KEY,
    public: {
      environment: process.env.ENVIRONMENT,
      domainURL: process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : 'https://avocado.instadapp.io',
      googleAnalyticsId: process.env.GA_ID,
      isVercelProd: process.env.VERCEL_ENV === 'production',
    },
  },
  nitro: {
    routeRules: {
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
        cache: {
          maxAge: 86400,
        },
      },
      '/api/tokens': {
        cache: {
          maxAge: 86400,
        },
      },
    },
  },
  pwa: {
    registerType: 'prompt',
    manifestFilename: 'icons/site.webmanifest',
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
          name: 'og:image',
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
          href: '/icons/site.webmanifest',
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
    '@vueuse/nuxt',
    '@nuxtjs/tailwindcss',
    '@instadapp/vue-web3-nuxt',
    '@vueuse/nuxt',
    '@pinia/nuxt',
  ],
  css: [
    '@fontsource/space-grotesk/400.css',
    '@fontsource/space-grotesk/500.css',
    '@fontsource/space-grotesk/600.css',
    '@fontsource/space-grotesk/700.css',
    '~/assets/css/app.css',
  ],

  imports: {
    dirs: ['./stores'],
  },

  routeRules: {
    '/icons/site.webmanifest': {
      headers: {
        'Content-Type': 'application/manifest+json',
      },
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        'bech32',
        'scrypt-js',
        'aes-js',
        'bn.js',
        'js-sha3',
        'hash.js'],
    },
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

})
