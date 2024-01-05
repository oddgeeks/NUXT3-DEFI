import type { SessionTypes } from '@walletconnect/types'

declare global {
  interface ISendData {
    fromChainId: number
    toChainId: number
    tokenAddress: string
    address: string
    amount: string
  }

type IBookmarkType = 'wc' | 'transfer'

interface IBookmark {
  payload?: {
    method: string
    params: any
  }
  metadata?: string
  session?: SessionTypes.Struct
  type: IBookmarkType
  name: string
  chainId: number | string
  sendData?: ISendData
  safeAddress: string
  edit?: boolean
}

  // omit name prop
  type CreateBookmarkProps = Partial<Omit<IBookmark, 'safeAddress'>>
}

export { }
