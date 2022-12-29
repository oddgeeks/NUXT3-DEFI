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

interface ISellToken {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  chainId: string;
  price: number;
  verified: boolean;
  coingeckoId: string;
  sparklinePrice7d: number[];
}

interface IBuyToken {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  chainId: string;
  price: number;
  verified: boolean;
  coingeckoId: string;
  sparklinePrice7d: number[];
}

interface IData {
  sellToken: ISellToken;
  buyToken: IBuyToken;
  sellTokenAmount: string;
  buyTokenAmount: string;
  slippage: number;
  maxSlippage: number;
  minBuyAmountSlippage: string;
  totalAggregators: number;
  bestBuyTokenAmount: string;
  worstBuyTokenAmount: string;
  avgBuyTokenAmount: string;
}

interface IConnector {
  name: string;
  calldata: string;
}

interface ISellToken2 {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  chainId: string;
  price: number;
  verified: boolean;
  coingeckoId: string;
  sparklinePrice7d: number[];
}

interface IBuyToken2 {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  chainId: string;
  price: number;
  verified: boolean;
  coingeckoId: string;
  sparklinePrice7d: number[];
}

interface IFromToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoURI: string;
  eip2612: boolean;
  domainVersion: string;
  tags: string[];
}

interface IToToken {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  logoURI: string;
  eip2612: boolean;
  tags: string[];
}

interface ITx {
  from: string;
  to: string;
  data: string;
  value: string;
  gas: number;
  gasPrice: string;
}

interface IRaw {
  fromToken: IFromToken;
  toToken: IToToken;
  toTokenAmount: string;
  fromTokenAmount: string;
  protocols: any[];
  tx: ITx;
}

interface IData2 {
  sellToken: ISellToken2;
  buyToken: IBuyToken2;
  sellTokenAmount: string;
  buyTokenAmount: string;
  unitAmt: string;
  to: string;
  calldata: string;
  gas: string;
  gasPrice: string;
  value: string;
  slippage: string;
  priceImpact: string;
  raw: IRaw;
}

interface IAggregator {
  name: string;
  connector: IConnector;
  data: IData2;
}

interface ISwapResponse {
  data: IData;
  aggregators: IAggregator[];
}
