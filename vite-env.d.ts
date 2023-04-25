interface Window {
  ethereum: any;
}

type ITxType = "send" | "swap" | "bridge" | "topUpGas" | "wc" | "upgrade";

type ChainId = 1 | 137 | 42161 | 10 | 56 | 43114 | 100 | 1101 | 634 | 63400;

interface Provider {
  id: string;
  name: string;
  logo: any;
  connect: () => Promise<any>;
  switchNetwork: (network: Network) => Promise<any>;
}

interface Network {
  name: string;
  debankName?: string;
  ankrName?: string;
  chainId: ChainId;
  isAvocado?: boolean;
  serverRpcUrl: string | undefined;
  balanceResolverAddress?: string;
  usdcAddress: string;
  explorerUrl: string;
  params: {
    chainName?: string;
    iconUrls?: string[];
    rpcUrls: string[];
    nativeCurrency?: {
      name: string;
      symbol: string;
      decimals: number;
    };
  };
}

interface NetworkVersion extends Network {
  latestVersion: string;
  currentVersion: string;
  notdeployed?: boolean;
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
  status: "pending" | "confirming" | "success" | "failed" | "dropped";
  revert_reason?: string;
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
  fromAsset: FromAsset2;
  toAsset: ToAsset3;
  bridgeRouteErrors: BridgeRouteErrors;
}

interface IBridgeTokensResult {
  name: string;
  address: string;
  icon: string;
  decimals: number;
  symbol: string;
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
  sheetPosition?: "top" | "bottom";
};

type IWeb3Action = "send" | "bridge" | "swap" | "topup" | "reedem" | "claim";

type ISlackMessageType = "danger" | "error" | "success" | "banner";

type MetadataProps = {
  type:
    | "transfer"
    | "bridge"
    | "swap"
    | "multi"
    | "gas-topup"
    | "upgrade"
    | "dapp"
    | "deploy"
    | "permit2";
  encodedData: string;
  version?: string;
};

type SignMetadataProps = {
  token: string;
  spender: string;
  amount: string;
  expiration: string;
};

type DappMetadataProps = {
  name: string;
  url: string;
};

type SendMetadataProps = {
  token: string;
  amount: string;
  receiver: string;
};

type UpgradeMetadataProps = {
  version: string;
  walletImpl: string;
};

type TopupMetadataProps = {
  amount: string;
  token: string;
  onBehalf: string;
};

type BridgeMetadataProps = {
  amount: string;
  receiver: string;
  fromToken: string;
  toToken: string;
  toChainId: string;
  bridgeFee: string;
  nativeToken: string;
};

type SwapMetadataProps = {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  receiver: string;
  protocol?: string;
};

type DiscountDetails = {
  discount?: number;
  name: string;
  tooltip: string;
  iconURL: string;
};

type CalculateFeeProps = {
  fee?: string;
  multiplier?: string;
  chainId: string;
  discountDetails?: DiscountDetails;
};

interface BuildInfo {
  version: string;
  commit: string;
  time: number;
  branch: string;
  env: string;
}

interface ISimulation {
  balanceChange: BalanceChange;
  transaction: Transaction;
}

interface BalanceChange {
  approveTokens: SimulationToken[];
  sendTokens: SimulationToken[];
  receiveTokens: SimulationToken[];
}

interface SimulationToken {
  token: string;
  from: string;
  to: string;
  amount: string;
  type?: "NFT" | "Burn" | "Mint" | "Flashloan" | null;
  nftMetadata?: {
    tokenUrl: string;
    imageUrl: string;
    name: string;
    description: string;
    traits: any[];
    contractType: string;
  };
}

interface Transaction {
  simulationId: string;
  gasLimit: number;
  status: boolean;
}

interface ICalculatedFee {
  discountDetails?: DiscountDetails;
  discountAmount: number;
  amountAfterDiscount: number;
  min: number;
  max: number;
  formatted: string;
  formattedAmountAfterDiscount: string;
}


 interface IContact {
  name: string
  address: string
  chainId: number | string
}

 interface ITransferCount {
  from: string
  to: string
  chainId: number | string
  transferCount: number
 }

interface ILogBalanceParams {
  chainId: number;
  isOnboard: boolean;
  isPublic: boolean;
 }