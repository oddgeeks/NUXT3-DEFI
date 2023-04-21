import VueGtag from 'vue-gtag-next'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  nuxtApp.vueApp.use(VueGtag, {
    property: {
      id: config.public.googleAnalyticsId,
      isEnabled: !!config.public.googleAnalyticsId,
    },
  })
})
