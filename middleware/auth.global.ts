export default defineNuxtRouteMiddleware((to) => {
  const routesToBeExclude = ['/', '/upgrade']
  const shouldExclude = routesToBeExclude.includes(to.fullPath)
  const cachedProviderName = useCookie('cachedProviderName')

  console.log(cachedProviderName.value)

  if (!cachedProviderName.value && shouldExclude)
    return navigateTo('/login')
})
