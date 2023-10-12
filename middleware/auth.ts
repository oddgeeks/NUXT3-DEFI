import { getRpcProvider } from '@instadapp/avocado-base/utils/network'
import { avoChainId } from '../utils/avocado'

export default defineNuxtRouteMiddleware(async (to) => {
  const trackAccount = useCookie<boolean>('trackAccount')
  const connectionMeta = useCookie<IConnectionMeta>('connection-meta')
  const referalCode = useCookie<string>('ref-code')

  const trackingUser = to.query?.user || trackAccount.value
  const refCode = to.query?.r as string
  const redirectPath = to.path
  const loginRedirectPath = `/login?redirectTo=${redirectPath}`

  const cachedProviderName = connectionMeta.value?.provider
  const connectionAddress = connectionMeta.value?.address
  let isAddressReferrer = false

  if (connectionAddress && !!refCode) {
    const avoProvider = getRpcProvider(avoChainId)

    isAddressReferrer = await avoProvider.send('api_hasReferralForUser', [connectionAddress])
  }

  const forceLogin = !!cachedProviderName && !!refCode && !isAddressReferrer

  if (refCode) {
    referalCode.value = refCode

    if (forceLogin)
      connectionMeta.value.provider = null

    const path = forceLogin ? loginRedirectPath : redirectPath

    return navigateTo(path, {
      replace: true,
    })
  }

  if (!cachedProviderName && !trackingUser)
    return navigateTo(loginRedirectPath)
})
