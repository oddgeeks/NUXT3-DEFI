export default defineNuxtRouteMiddleware((to) => {
  const cachedProviderName = useCookie('cachedProviderName')

  const redirectPath = to.path

  if (!cachedProviderName.value)
    return navigateTo(`/login?redirectTo=${redirectPath}`)
})
