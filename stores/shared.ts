import type { ethers } from 'ethers'
import { StaticJsonRpcRetryProvider } from '@instadapp/utils'

const rpcInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}

export const useShared = defineStore('shared', () => {
  const rpcs = ref<Record<string, string>>({})
  const isProd = ref(false)

  function getRpcFallbackUrl(chainId: string | number) {
    const rpcURL = rpcs.value[chainId]

    if (rpcURL)
      return rpcURL

    const network = availableNetworks.find(i => i.chainId == chainId)

    if (network)
      return network.params.rpcUrls[0]
  }

  function getRpcProviderByChainId(chainId: number | string) {
    const rpcURL = getRpcFallbackUrl(chainId)

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    if (!rpcInstances[chainId])
      rpcInstances[chainId] = new StaticJsonRpcRetryProvider(rpcURL)

    return rpcInstances[chainId]
  }

  function getRpcURLByChainId(chainId: number | string) {
    const rpcURL = getRpcFallbackUrl(chainId)

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    return rpcURL
  }

  return {
    isProd,
    rpcs,
    getRpcProviderByChainId,
    getRpcURLByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
