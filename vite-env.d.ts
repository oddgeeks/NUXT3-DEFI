interface Window {
  ethereum: any;
}

interface Provider {
  name: string;
  logo: any;
  connect: () => Promise<any>;
  switchNetwork: (network: Network) => Promise<any>;
}

interface Network {
  name: string;
  chainId: number;
  icon: any;
  params: {
    chainName?: string;
    rpcUrls?: string[];
    blockExplorerUrls?: string[];
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
}

interface IAvocadoTransaction {
  id: number
  chain_id: string
  hash: string
  from: string
  to: string
  data: string
  confirmations: number
  status: string
  gas_limit: string
  gas_price: string
  value: string
  block_number: number
  nonce: number
  metadata: {
    safe?: string
    signer?: string
  }
  created_at: string
  updated_at: string
}
