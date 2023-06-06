export default defineNuxtRouteMiddleware((to) => {
  const routesToBeExclude = ['/', '/upgrade']
  const shouldExclude = routesToBeExclude.includes(to.fullPath)
  const cachedProviderName = useCookie('cachedProviderName')

  if (!cachedProviderName.value && shouldExclude)
    return navigateTo('/login')
})
