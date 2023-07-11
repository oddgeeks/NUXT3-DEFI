
interface IMultisigTransaction {
  id: string
  chain_id: string
  nonce: string
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

interface IMultisigBroadcastParams {
  confirmations: Confirmation[]
  message: Data
  owner: string
  safe: string
  targetChainId: string | number
}

type TransactionsAction = {
  to: string
  value?: string
  data?: string
  operation?: string
  target?: string
}

interface TransactionAction extends TransactionsAction { 
 chainId: number | string
}

interface IMultisigTransactionResponse {
  meta: {
  "total": number,
  "per_page": number,
  "current_page": number,
  "last_page": number,
  "first_page": number,
  "first_page_url": string,
  "last_page_url": string,
  "next_page_url": string,
  "previous_page_url": string
}
  data: IMultisigTransaction[]
}

interface IGenerateMultisigSignatureParams {
  chainId: string | number
  actions: TransactionsAction[]
  nonce?: number
  metadata?: string
  note?: string
  clearModals?: boolean
  estimatedFee?: boolean
  options?: any
  rejection?: boolean
  rejectionId?: string
}

interface IOpenNonceModalParams {
  chainId: number | string;
  actions: any[]; defaultNonce?: number;
  estimatedFee?: boolean
  rejection?: boolean
  rejectionId?: string
}