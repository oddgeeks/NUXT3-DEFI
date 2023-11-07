export default defineNuxtRouteMiddleware((to) => {
  const trackAccount = useCookie<boolean>('trackAccount')
  const connectionMeta = useCookie<IConnectionMeta>('connection-meta')

  const trackingUser = to.query?.user || trackAccount.value

  const redirectPath = to.path

  if (!connectionMeta.value?.provider && !trackingUser)
    return navigateTo(`/login?redirectTo=${redirectPath}`)
})
