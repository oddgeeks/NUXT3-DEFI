interface IMultisigTransaction {
  id: string
  chain_id: string
  nonce: string
  index: number
  owner: string
  safe_address: string
  signers: string[]
  confirmations: Confirmation[]
  data: Data
  confirmations_required: number
  note: any
  transaction_hash: any
  status: string
  created_at: string
  updated_at: string
  executed_at: any
  groupKey?: string
}

interface Confirmation {
  address: string
  signature: string
  created_at: number
}

interface Data {
  params: Params
  forwardParams: ForwardParams
}

interface Params {
  id: number
  salt: string
  source: string
  actions: Action[]
  metadata: string
  avoSafeNonce: number
}

interface Action {
  data: string
  value: string
  target: string
  operation: string
}

interface ForwardParams {
  gas: string
  gasPrice: string
  validAfter: string
  validUntil: string
}

interface ISignatureParams {
  signature: string
  signer: string
}

interface IAvailableSigner {
  chainId: string | number
  addresses: string[]
}

interface IMultisigBroadcastParams {
  proposalId: string
  confirmations: Confirmation[]
  message: Data
  owner: string
  safe: string
  signers: string[]
  targetChainId: string | number
  ignoreSlack?: boolean
  mfa_code?: string
  mfa_type?: Mfa
  mfa_token?: string
  debug?: any
}

interface IChangeThresholdParams {
  threshold: string
  chainId: string | number
}

interface IRemoveSignerParams {
  addresses: string[]
  chainId: number | string
  threshold?: number
  actionsOnly?: boolean
}

interface IAddSignerParams {
  addresses: ISignerAddress[]
  threshold: string
  chainId: number | string
  actionsOnly?: boolean
}

interface TransactionsAction {
  to: string
  value?: string
  data?: string
  operation?: string
  target?: string
}

interface TransactionAction extends TransactionsAction {
  chainId: number | string
}

interface ResponseMeta {
  'total': number
  'per_page': number
  'current_page': number
  'last_page': number
  'first_page': number
  'first_page_url': string
  'last_page_url': string
  'next_page_url': string
  'previous_page_url': string
}

interface IMultisigTransactionResponse {
  meta: ResponseMeta
  data: IMultisigTransaction[]
}

interface IGenerateMultisigSignatureParams {
  chainId: string | number
  actions: TransactionsAction[]
  nonce?: number
  metadata: string
  note?: string
  estimatedFee?: boolean
  options?: any
  rejection?: boolean
  rejectionId?: string
  transactionType?: TransactionActionType
  clearModals?: boolean
}

interface IOpenNonceModalParams {
  chainId: number | string
  actions: any[]
  defaultNonce?: number
  estimatedFee?: boolean
  rejection?: boolean
  rejectionId?: string
  transactionType: TransactionActionType
  metadata: string
  options?: any
}

interface ICreateBatchModal {

}

interface IOpenExecuteModalParams {
  transaction: IMultisigTransaction
  isGasTopup: boolean
}

interface SignerSteps {
  currentStep: number
  totalSteps: number
}

interface IAddSignerModalParams {
  addresses?: ISignerAddress[]
  gnosisAddress?: string
  threshold?: number
  defaultSelectedNetworks?: number[]
}

interface ISelectSignerNetworkModalParams {
  addresses: ISignerAddress[]
  defaultSelectedNetworks?: number[]
  defaultThreshold?: number
  gnosisAddress?: string
}

interface IReviewSignerModalParams {
  addresses: ISignerAddress[]
  gnosisAddress?: string
  defaultSelectedNetworks?: number[]
  defaultThreshold?: number
}

type IMultisigAction = 'add-signers' | 'remove-signers' | 'change-threshold'

type TransactionActionType = IWeb3Action | IMultisigAction | 'others'
