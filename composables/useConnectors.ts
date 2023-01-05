import { network , torus, injected, walletconnect, magic} from "~~/connectors";

const providers = {
  // network,
  // torus,
  injected,
  // magic,
  walletconnect
}

export function useConnectors() {
  const cachedProviderName = useLocalStorage("cachedProviderName", null);

  function setConnectorName(name: string|null) {
    cachedProviderName.value = name
  }

  function getConnector() {
      return providers[cachedProviderName.value]
  }

  return {
    setConnectorName,
    getConnector,
  };
}
