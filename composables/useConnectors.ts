import { storeToRefs } from 'pinia'
import { injected, walletconnect, walletlink } from '~~/connectors'

const providers = {
  // network,
  // torus,
  injected,
  walletlink,
  walletconnect,
}

export function useConnectors() {
  const { rpcs } = storeToRefs(useShared())
  const { deactivate, connector } = useWeb3()
  const { resetAccounts } = useSafe()

  const router = useRouter()

  const cachedProviderName = useCookie('cachedProviderName', {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  })

  function onDisconnect() {
    resetAccounts()
    setConnectorName(null)
    router.push('/login')
    if (connector.value)
      deactivate()
  }

  function setConnectorName(name: string | null) {
    cachedProviderName.value = name
  }

  function getConnector(): any {
    if (!process.client)
      return
    const cachedProvider = cachedProviderName.value

    return cachedProvider ? (providers as any)[cachedProvider]?.(rpcs.value) : null
  }

  return {
    setConnectorName,
    getConnector,
    cachedProviderName,
    onDisconnect,
  }
}
