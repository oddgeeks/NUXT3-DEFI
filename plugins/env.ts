import isUndefined from 'lodash/isUndefined'

export default defineNuxtPlugin(async () => {
  const shared = useShared()

  const { public: { environment } } = useRuntimeConfig()

  const route = useRoute()

  const isAppProduction = useCookie<boolean | undefined>('app.production')
  const queryProd = route.query?.prod

  shared.isProd = environment === 'production'

  if (!isUndefined(queryProd))
    isAppProduction.value = queryProd == 'true'

  if (!isUndefined(isAppProduction.value))
    shared.isProd = isAppProduction.value

  if (process.client && !isUndefined(queryProd)) {
    setTimeout(() => {
      const url = new URL(window.location.href)

      url.searchParams.delete('prod')

      window.history.replaceState({}, '', url.href)
    }, 500)
  }
})
