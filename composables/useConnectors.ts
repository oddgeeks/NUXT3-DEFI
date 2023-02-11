import { network, torus, injected, walletconnect, walletlink } from "~~/connectors";

const providers = {
  // network,
  // torus,
  injected,
  walletconnect,
  walletlink,
}

export function useConnectors() {
  const cachedProviderName = useLocalStorage<string | null>("cachedProviderName", null);

  function setConnectorName(name: string | null) {
    cachedProviderName.value = name
  }

  function getConnector(): any {
    return cachedProviderName.value ? (providers as any)[cachedProviderName.value as any] : null
  }

  return {
    setConnectorName,
    getConnector,
  };
}
