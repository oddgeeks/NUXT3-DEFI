import { injected, walletconnect, walletlink } from '~~/connectors'

const providers = {
  // network,
  // torus,
  injected,
  walletlink,
  walletconnect,
}

export function useConnectors() {
  const cachedProviderName = useCookie('cachedProviderName', {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  })

  function setConnectorName(name: string | null) {
    cachedProviderName.value = name
  }

  function getConnector(): any {
    if (!process.client)
      return
    const provider = cachedProviderName.value
    return provider ? (providers as any)[provider] : null
  }

  return {
    setConnectorName,
    getConnector,
    cachedProviderName,
  }
}
