import { injected, walletconnect, walletlink } from '~~/connectors'

const cachedProviderName = useLocalStorage<string>('cachedProviderName', '')

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
    if (name)
      localStorage.setItem('cachedProviderName', name)
    else localStorage.removeItem('cachedProviderName')
  }

  function getConnector(): any {
    if (!process.client)
      return
    const provider = localStorage.getItem('cachedProviderName')
    return provider ? (providers as any)[provider] : null
  }

  function getConnectorName(): any {
    if (!process.client)
      return
    const provider = localStorage.getItem('cachedProviderName')
    return provider
  }

  return {
    setConnectorName,
    getConnector,
    getConnectorName,
    cachedProviderName,
  }
}
