interface ISocketQuoteResult {
  success: boolean
  result: Result
}

interface Result {
  routes: IRoute[]
  destinationCallData: DestinationCallData
  fromChainId: number
  fromAsset: FromAsset
  toChainId: number
  toAsset: ToAsset
  bridgeRouteErrors: BridgeRouteErrors
}

interface DestinationCallData {}

interface FromAsset {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: any
}

interface ToAsset {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: any
}

interface BridgeRouteErrors {
  'polygon-bridge': PolygonBridge
  hyphen: Hyphen
  'arbitrum-bridge': ArbitrumBridge
  'anyswap-router-v4': AnyswapRouterV4
  'anyswap-router-v6': AnyswapRouterV6
  hop: Hop
  celer: Celer
  'refuel-bridge': RefuelBridge
  'optimism-bridge': OptimismBridge
  stargate: Stargate
  cctp: Cctp
  connext: Connext
}

interface PolygonBridge {
  status: string
}

interface Hyphen {
  status: string
}

interface ArbitrumBridge {
  status: string
}

interface AnyswapRouterV4 {
  status: string
}

interface AnyswapRouterV6 {
  status: string
}

interface Hop {
  status: string
}

interface Celer {
  status: string
}

interface RefuelBridge {
  status: string
}

interface OptimismBridge {
  status: string
}

interface Stargate {
  status: string
}

interface Cctp {
  status: string
}

interface Connext {
  status: string
}

interface IScoketBuildTxResult {
  success: boolean
  result: Result
}

interface Result {
  userTxType: string
  txType: string
  txData: string
  txTarget: string
  chainId: number
  userTxIndex: number
  value: string
  approvalData: ApprovalData
}

interface ApprovalData {
  minimumApprovalAmount: string
  approvalTokenAddress: string
  allowanceTarget: string
  owner: string
}

interface IRoute {
  routeId: string
  isOnlySwapRoute: boolean
  fromAmount: string
  toAmount: string
  usedBridgeNames: string[]
  minimumGasBalances: MinimumGasBalances
  chainGasBalances: ChainGasBalances
  totalUserTx: number
  sender: string
  recipient: string
  totalGasFeesInUsd: number
  receivedValueInUsd: number
  inputValueInUsd: number
  outputValueInUsd: number
  userTxs: UserTx[]
  serviceTime: number
  maxServiceTime: number
  integratorFee: IntegratorFee
}

interface MinimumGasBalances {
  '1': string
  '137': string
}

interface ChainGasBalances {
  '1': N1
  '137': N137
}

interface N1 {
  minGasBalance: string
  hasGasBalance: boolean
}

interface N137 {
  minGasBalance: string
  hasGasBalance: boolean
}

interface UserTx {
  userTxType: string
  txType: string
  chainId: number
  toAmount: string
  toAsset: ToAsset
  stepCount: number
  routePath: string
  sender: string
  approvalData: ApprovalData
  steps: Step[]
  gasFees: GasFees2
  serviceTime: number
  recipient: string
  maxServiceTime: number
  bridgeSlippage: number
  userTxIndex: number
}

interface ToAsset {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: string
}

interface ApprovalData {
  minimumApprovalAmount: string
  approvalTokenAddress: string
  allowanceTarget: string
  owner: string
}

interface Step {
  type: string
  protocol: Protocol
  bridgeSlippage: number
  fromChainId: number
  fromAsset: FromAsset
  fromAmount: string
  toChainId: number
  toAsset: ToAsset2
  minAmountOut: string
  toAmount: string
  protocolFees: ProtocolFees
  gasFees: GasFees
  serviceTime: number
  maxServiceTime: number
}

interface Protocol {
  name: string
  displayName: string
  icon: string
  securityScore: number
  robustnessScore: number
}

interface FromAsset {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: string
}

interface ToAsset2 {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: string
}

interface ProtocolFees {
  asset: Asset
  feesInUsd: number
  amount: string
}

interface Asset {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: string
}

interface GasFees {
  gasAmount: string
  asset: Asset2
  gasLimit: number
  feesInUsd: number
}

interface Asset2 {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: any
}

interface GasFees2 {
  gasAmount: string
  feesInUsd: number
  asset: Asset3
  gasLimit: number
}

interface Asset3 {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: any
}

interface IntegratorFee {
  amount: string
  asset: Asset4
}

interface Asset4 {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  logoURI: string
  chainAgnosticId: string
}

interface ICrossSendParams {
  targetMessage: any
  sourceMessage: any
  targetChainId: number
  sourceChainId: number
}

interface ICrossEstimatedFee {
  source: Source
  target: Target
}

interface Source {
  fee: string
  multiplier: string
  discount: IEstimatedDiscount
}

interface Target {
  fee: string
  multiplier: string
  discount: IEstimatedDiscount
}

interface ICombineFeeParams {
  source: CombineFee
  target: CombineFee
}

interface CombineFee {
  chainId: string
  fee: string
  multiplier: string
}

interface ICrossSignatures {
  source: CrossSignature
  target: CrossSignature
}

interface CrossSignature {
  signature: string
  owner: string
  chainId: string
}

interface TotalFee {
  amount: string
  amountInUsd: string
  token: IBalance | null
}

interface ICrossChainTx {
  id: string
  owner_address: string
  safe_address: any
  source_transaction_id: any
  source_payload: SourcePayload
  source_status: string
  source_transaction_hash: any
  source_delayed_until: string
  source_delayed_count: number
  source_chain_id: string
  source_safe_nonce: string
  source_error: string
  target_transaction_id: any
  target_payload: TargetPayload
  target_status: string
  target_transaction_hash: any
  target_delayed_until: any
  target_delayed_count: number
  target_chain_id: string
  target_safe_nonce: string
  target_error: any
  status: string
  created_at: string
  updated_at: string
  source_transaction: any
  target_transaction: any
}

interface SourcePayload {
  owner: string
  chainId: string
  message: Message
  signature: string
}

interface Message {
  params: Params
  actions: Action[]
  avoSafeNonce: string
}

interface Params {
  id: string
  gas: string
  source: string
  metadata: string
  validUntil: string
}

interface Action {
  data: string
  value: string
  target: string
  operation: string
}

interface TargetPayload {
  owner: string
  chainId: string
  message: Message2
  signature: string
}

interface Message2 {
  params: Params2
  actions: Action2[]
  avoSafeNonce: string
}

interface Params2 {
  id: string
  gas: string
  source: string
  metadata: string
  validUntil: string
}

interface Action2 {
  data: string
  value: string
  target: string
  operation: string
}
