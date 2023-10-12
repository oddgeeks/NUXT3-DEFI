export default defineNuxtRouteMiddleware((to) => {
  const trackAccount = useCookie<boolean>('trackAccount')
  const cachedProviderName = useCookie('cachedProviderName')
  const referalCode = useCookie<string>('ref-code')

  const trackingUser = to.query?.user || trackAccount.value
  const refCode = to.query?.r as string
  const redirectPath = to.path
  const loginRedirectPath = `/login?redirectTo=${redirectPath}`

  const forceLogin = !!cachedProviderName.value && !!refCode

  if (refCode) {
    referalCode.value = refCode

    if (forceLogin)
      cachedProviderName.value = undefined

    const path = forceLogin ? loginRedirectPath : redirectPath

    return navigateTo(path, {
      replace: true,
    })
  }

  if (!cachedProviderName.value && !trackingUser)
    return navigateTo(loginRedirectPath)
})
