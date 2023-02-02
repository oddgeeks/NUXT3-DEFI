interface Window {
  ethereum: any;
}

type ITxType = "send" | "swap" | "bridge" | "topUpGas" | "wc";
interface Provider {
  id: string;
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
  allowanceSpender: string;
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
// type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>

interface IModal {
  id: string;
  component: DefineComponent | ConcreteComponent;
  componentProps: any;
  options?: IOptions;
  destroy: () => void;
  async: boolean;
  onResolve: (success: boolean, payload?: any) => Promise<unknown>;
  onReject: (success: boolean, payload?: any) => Promise<unknown>;
}

type ISnackOptions = {
  message: string;
  type: "success" | "error";
  open?: boolean;
  timeout?: number;
};

type IOptions = {
  raw?: boolean;
  clickToClose?: boolean;
  wrapperClass?: string;
  contentClass?: string;
  snackOptions?: ISnackOptions;
};

type IWeb3Action = "send" | "bridge" | "swap" | "topup" | "reedem" | "claim";

type ISlackMessageType = "danger" | "error" | "success" | "banner";

type CalculateFeeProps = {
  fee?: string;
  multiplier?: string;
  chainId: string;
};
