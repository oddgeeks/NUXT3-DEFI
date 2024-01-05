import type { Web3Provider } from '@ethersproject/providers'

declare module '@instadapp/vue-web3' {
  interface IVueWeb3Library extends Web3Provider {}
}
