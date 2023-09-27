import { JsonRpcRetryBatchProvider, StaticJsonRpcRetryProvider } from '@instadapp/utils'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ethers } from 'ethers'

const rpcBatchInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}
const rpcBatchRetryInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}
const rpcInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}

export const useShared = defineStore('shared', () => {
  const rpcs = ref<Record<string, string>>({})

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

    if (!rpcInstances[chainId]) {
      rpcInstances[chainId] = new StaticJsonRpcRetryProvider(rpcURL, {
        delay: 50,
      })
    }

    return rpcInstances[chainId]
  }

  function getRpcBatchProviderByChainId(chainId: number | string) {
    const rpcURL = getRpcFallbackUrl(chainId)

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    if (!rpcBatchInstances[chainId])
      rpcBatchInstances[chainId] = new ethers.providers.JsonRpcBatchProvider(rpcURL)

    return rpcBatchInstances[chainId]
  }

  function getRpcBatchRetryProviderByChainId(chainId: number | string) {
    const rpcURL = getRpcFallbackUrl(chainId)

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    if (!rpcBatchRetryInstances[chainId]) {
      rpcBatchRetryInstances[chainId] = new JsonRpcRetryBatchProvider(rpcURL, {
        delay: 50,
      })
    }

    return rpcBatchRetryInstances[chainId]
  }

  function getRpcURLByChainId(chainId: number | string) {
    const rpcURL = getRpcFallbackUrl(chainId)

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    return rpcURL
  }

  return {
    rpcs,
    getRpcProviderByChainId,
    getRpcURLByChainId,
    getRpcBatchProviderByChainId,
    getRpcBatchRetryProviderByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
