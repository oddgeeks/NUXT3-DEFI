export default defineNuxtRouteMiddleware((to) => {
  const trackAccount = useCookie<boolean>('trackAccount')
  const cachedProviderName = useCookie('cachedProviderName')

  const trackingUser = to.query?.user || trackAccount.value

  const redirectPath = to.path

  if (!cachedProviderName.value && !trackingUser)
    return navigateTo(`/login?redirectTo=${redirectPath}`)
})
