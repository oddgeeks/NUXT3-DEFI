import { network, torus, injected, walletconnect, magic, walletlink } from "~~/connectors";

const providers = {
  // network,
  // torus,
  injected,
  // magic,
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
