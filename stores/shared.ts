import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore } from 'pinia'

export const useShared = defineStore('shared', () => {
  const rpcs = ref<Record<string, string>>({})

  function getRpcProviderByChainId(chainId: number | string) {
    const rpcURL = rpcs.value[chainId]

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    return new ethers.providers.StaticJsonRpcProvider(
      rpcURL,
    )
  }

  function getRpcURLByChainId(chainid: number | string) {
    const rpcURL = rpcs.value[chainid]

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainid}`)

    return rpcURL
  }

  return {
    rpcs,
    getRpcProviderByChainId,
    getRpcURLByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
