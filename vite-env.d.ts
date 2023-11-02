interface Window {
  ethereum: any;
}

declare module '*.svg?component' {
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const src: FunctionalComponent<SVGAttributes>
  export default src
}

declare module '*.svg?url' {
  const src: string
  export default src
}

declare module '*.svg?raw' {
  const src: string
  export default src
}

declare module '*.svg?skipsvgo' {
  import { FunctionalComponent, SVGAttributes } from 'vue'
  const src: FunctionalComponent<SVGAttributes>
  export default src
}

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
  zerionName?: string;
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
  currentImplementationAddress?: string;
  latestImplementationAddress?: string;
}

interface ISafeOptions {
  chainId: string | number,
  threshold: number,
  nonce: number,
  latestVersion: string,
  currentVersion: string,
  safeAddress: string,
  ownerAddress: string,
  notdeployed: boolean,
  server: boolean,
  domainName: string,
}

interface IAvocadoTransaction {
  id: number;
  chain_id: string;
  hash: string;
  from: string;
  to: string;
  data: string;
  fee: string;
  effective_fee: string;
  balance_transactions: IAvocadoBalanceTransaction[];
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
    multisig: boolean;
    multisig_index: number;
    multisig_signers: string[];
    multisig_hash?: string;
    owner?: string;
    source?: string;
  };
  created_at: string;
  updated_at: string;
  decodedMetadata?: any;
  isBridge?: boolean;
  crosschain_transaction: ICrosschainTransaction | null;
  crosschain_transaction_id: string | null;
  cross: true;
}

interface IBridgeResponse {
  success: boolean;
  result: IBridgeResult;
}

interface IBridgeResult {
  routes: IRoute[];
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
  chainId: number;
  chainAgnosticId: string;
  balance?: string;
  price?: number;
  score?: number;
}

interface IGenerateSignatureMessageParams {
  chainId: string | number
  actions: TransactionsAction[]
  options?: any
}

interface ISignLegacyDataParams {
  message: any
  chainId: string | number
}


interface IBridgeTokensResponse {
  success: boolean;
  result: IBridgeTokensResult[];
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

interface IBatchJson {
  version: string;
  batch: IBatch[];
}

type BatchFormValues = {
    abi: string;
    toAddress: string;
    contractAddress: string;
    value: string;
    chainId: number;
    method: string;
    params?: string;
    raw?: string;
    [key: string]: any?;
}

interface IBatch {
  formValues: BatchFormValues,
}

interface IDecodedParams {
  method: string;
  builder: any;
  inputs: any;
  args: any;
}

interface ICreateBatchModal{
  chainId: number | string
  batch: IBatch[]
  mode: TxBuilderModes
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

interface IOptionsSafe {
  multisig: number;
  multisig_index: number,
  owner_address: string,
  safe_address: string,
}

interface IOptionsParams {
  safe: IOptionsSafe,
  chainId: string | number,
  provider: ethers.providers.StaticJsonRpcProvider
  server?: boolean
  is_prod: boolean
} 

interface IComputeSafeParams {
  provider: ethers.providers.StaticJsonRpcProvider
  accountAddress: string
  isProd: boolean
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
  type: "success" | "error" | 'info';
  open?: boolean;
  timeout?: number;
};

type IOptions = {
  raw?: boolean;
  closeButton?: boolean;
  clickToClose?: boolean;
  wrapperClass?: string;
  contentClass?: string;
  snackOptions?: ISnackOptions;
  sheetPosition?: "top" | "bottom";
};

type IWeb3Action = "transfer" | "bridge" | "swap" | "gas-topup" | "reedem" | "claim" | 'deploy' | 'upgrade' | 'nft' | 'dapp';

type ISlackMessageType = "danger" | "error" | "success" | "banner" | 'observer';

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
  amount: number;
  name: string;
  description: string;
};

type CalculateFeeProps = {
  fee?: string;
  multiplier?: string;
  chainId: string;
  discountDetails?: DiscountDetails[];
};

interface BuildInfo {
  version: string;
  commit: string;
  time: number;
  branch: string;
  env: string;
}

interface ISimulation {
  transaction: Transaction;
  simulation: ISimulationChange;
}

interface ISimulationChange {
  approveTokens: SimulationToken[];
  sendTokens: SimulationToken[];
  receiveTokens: SimulationToken[];
  revokeTokens?: SimulationToken[];
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

interface AppliedDiscountDetails extends DiscountDetails {
  discountAmountMin: number;
  discountAmount: number;
  formattedDiscountAmount: string;
}

interface ICalculatedFee {
  discountDetails?: AppliedDiscountDetails[];
  amountAfterDiscount: number;
  discountAvailable: boolean;
  min: number;
  max: number;
  formatted: string;
  formattedAmountAfterDiscount: string;
  minAmountAfterDiscount: number;
  maxAmountAfterDiscount: number;
  chainId: string;
}

interface NFTAttributes { 
  type: string;
  value: string;
}

interface NFTData {
  imageUrl: string;
  thumbnailUrl: string;
  collectionName: string;
  name: string;
  chainId: number;
  tokenId: string;
  contractAddress: string;
  contractType: string;
  attributes: NFTAttributes[];
  animationUrl?: string;
}

interface NFTParams {
  pageSize: number;
}


 interface IContact {
  name: string
  address: string
  chainId: number | string
  owner?: boolean
  notEditable?:  boolean
  notDeletable?: boolean
}

 interface ITransferCount {
  from: string
  to: string
  chainId: number | string
  transferCount: number
 }



interface ITokenPrice {
  address: string
  chain_id: string
  name: string
  symbol: string
  decimals: number
  logo_url: string
  price: string
  coingecko_id: string
  sparkline_price_7d: number[]
}

interface ILogBalanceParams {
  isPublic?: boolean
  chainId: number;
  type: 'eoa-balances' | 'safe-balances' | 'options' | 'compute'
  isPublic: boolean;
}
 
interface IEstimatedFeeData {
  fee: string;
  multiplier: string;
  discount: IEstimatedDiscount;
}

 interface IEstimatedDiscount {
  amount: number
  transactionCount: number
  program: string
  name: string
  description: string
}


 interface Discount {
  max: number
  amount: number
 }
 type ImportProtocolKeys =
  | "aave-v3"
  | "aave-v2"
  | "compound"
  | "compound-v3"
  | "makerdao"
  | 'lite'

 interface DefiApis {
  protocol: ImportProtocolKeys;
  protocolId: number;
  apiPath: string;
  chainId: number;
  logoURI?: string;
  label: string;
  instadappURL: string;
  defiURL: string;
}

interface Positions extends DefiApis {
  positions: {
    data?: any[]
    tokens?: any[]
    healthFactor?: string
    totalSupplyInUsd: string
    totalBorrowInUsd: string
    compPriceInUsd?: string
  } ;
  vaultId?: string;
  apy: string;
  healthFactor: string;
  id: string;
  suppliedTokens: any[];
  borrowedTokens: any[];
}

interface IDefiActions {
  getApy: (positions: any) => any
  getSuppliedTokens: (positions: any) => any[]
  getBorrowedTokens: (positions: any) => any[]
}

type IDefiToken = {
  key: string;
  price?: string;
  tokenAddress: string;
}

interface ISafesResponse {
  data: ISafe[]
  page: number
  totoal
}

 interface ISafe {
  fully_deployed: number
  id: number
  safe_address: string
  owner_address: string
  created_at: string
  updated_at: string
  multisig: 0 | 1 | number
  mfa_email_verified: 0 | 1
  mfa_phone_verified : 0 | 1
  mfa_totp_verified : 0 | 1
  deployed: Record<string, boolean>,
  version: Record<string, string>
  authorities: Record<string, string[]>
  signers: Record<string, string[]>
  multisig_index: number;
 }

interface IRequiredSigners {
  chainId: number | string
  requiredSignerCount: number
  signerCount: number
  signers: string[]
 }

interface ISigner {
  address: string
  chainIds: string[]
}

type ChainFees = Record<string, ICalculatedFee>
type ChainFeeErrors = Record<string, string>

interface ISignerAddress {
  name: string
  address: string
}

interface INavigationTab {
  label: string;
  value: 'dapps' | 'balances' | 'bookmarks';
  query?: string;
  count: number;
}

interface IComputeAddresses {
  address: string
  multisigAddress: string
  oldSafeAddress: string
}

type TxBuilderModes = 'expand' | 'collapse' | 'super-collapse' | 'raw'


interface IMfaAuthenticateParams {
  
}

type MfaRequestType = 'transaction' | 'delete' | 'update'

interface IMfaActivateModalParams {
  mfaType: IMfa
}

type MfaVerify = (mfa: IMfa, code: string) => Promise<boolean>

type MfaExpire = '30min' | '60min'

interface IMfaVerifyModalParams {
  mfa: IMfa,
  mfaRequestType: MfaRequestType,
  verify?: MfaVerify
  request?: Function
  inputValue?: string
  authenticate?: boolean,
  defaultSessionAvailable?: boolean
  expire?: MfaExpire
  chainId?: number | string
}

interface IAuthVerifyParams {
  mfa: IMfa
  mfaRequestType: MfaRequestType
  submitFn?: MfaVerify
  defaultSessionAvailable?: boolean
  expire?: MfaExpire
  chainId?: number | string
}

interface IAuthTransactionMfa {
  _authMfa?: IMfa
  submitFn?: MfaVerify
  defaultSessionAvailable?: boolean
  forceGrabSession?: boolean
  expire?: MfaExpire
  chainId?: number | string
}

interface IOpenReviewSignerProcessModalParams{
  chainId: number | string
  deleteSigner?: boolean
  isInstadappSigner?: boolean
  removeBackupSigner?: boolean
  actions: {
    actions: TransactionsAction[]
    metadata: string
  }
}