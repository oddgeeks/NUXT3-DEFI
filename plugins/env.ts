export default defineNuxtPlugin(async () => {
  const { isProd, isAppProduction } = storeToRefs(useShared())

  const { public: { environment } } = useRuntimeConfig()

  isProd.value = environment === 'production' ? true : !!isAppProduction.value
})
