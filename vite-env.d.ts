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
  id: number;
  chain_id: string;
  hash: string;
  from: string;
  to: string;
  data: string;
  fee: string;
  confirmations: number;
  status: "pending" | "confirming" | "success" | "failed";
  gas_limit: string;
  gas_price: string;
  value: string;
  block_number: number;
  nonce: number;
  metadata: {
    safe?: string;
    signer?: string;
  };
  created_at: string;
  updated_at: string;
}

interface IBridgeResponse {
  success: boolean;
  result: IBridgeResult;
}

interface IBridgeResult {
  routes: Route[];
  fromChainId: number;
  fromAsset: FromAsset2;
  toChainId: number;
  toAsset: ToAsset3;
  bridgeRouteErrors: BridgeRouteErrors;
}

interface IBridgeTokensResult {
  name: string;
  address: string;
  icon: string;
  decimals: number;
  symbol: string;
  chainId: number;
  logoURI: string;
  chainAgnosticId: string;
}

interface IBridgeTokensResponse {
  success: boolean;
  result: Result[];
}
