import { StaticJsonRpcRetryProvider } from '@instadapp/utils'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ethers } from 'ethers'

const rpcBatchInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}
const rpcInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}

export const useShared = defineStore('shared', () => {
  const rpcs = ref<Record<string, string>>({})

  function getRpcProviderByChainId(chainId: number | string) {
    const rpcURL = rpcs.value[chainId]

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
    const rpcURL = rpcs.value[chainId]

    if (!rpcURL)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    if (!rpcBatchInstances[chainId])
      rpcBatchInstances[chainId] = new ethers.providers.JsonRpcBatchProvider(rpcURL)

    return rpcBatchInstances[chainId]
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
    getRpcBatchProviderByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
