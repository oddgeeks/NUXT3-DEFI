import type { SessionTypes } from '@walletconnect/types'

declare global {
interface IWcBookmark {
    payload: {
      method: string;
      params: any;
    }
    session: SessionTypes.Struct
    name: string
    chainId: number | string;
  safeAddress: string;
  edit?: boolean;
}

  
  // omit name prop
  type CreateBookmarkProps = Partial<Omit<IWcBookmark, 'safeAddress'>>
}

export { }