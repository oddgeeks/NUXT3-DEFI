import { network, torus, injected, walletconnect, walletlink } from "~~/connectors";

const providers = {
  // network,
  // torus,
  injected,
  walletconnect,
  walletlink,
}

export function useConnectors() {
  function setConnectorName(name: string | null) {
    if (!process.client || !name) return;
    localStorage.setItem('cachedProviderName', name);
  }

  function getConnector(): any {
    if (!process.client) return;
    const provider = localStorage.getItem('cachedProviderName');
    return provider ? (providers as any)[provider] : null;
  }

  return {
    setConnectorName,
    getConnector,
  };
}
