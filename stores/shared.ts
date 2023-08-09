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

  return {
    rpcs,
    getRpcProviderByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
