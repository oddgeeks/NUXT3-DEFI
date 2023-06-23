
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
  meta: any
  data: IMultisigTransaction[]
}

interface IGenerateMultisigSignatureParams {
  chainId: string | number
  actions: TransactionsAction[]
  nonce?: number
}