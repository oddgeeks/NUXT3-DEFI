import { injected, walletconnect, walletlink } from '~~/connectors'

const cachedProviderName = useLocalStorage<string>('cachedProviderName', null)

const providers = {
  // network,
  // torus,
  injected,
  walletconnect,
  walletlink,
}

export function useConnectors() {
  function setConnectorName(name: string | null) {
    if (!process.client)
      return
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
