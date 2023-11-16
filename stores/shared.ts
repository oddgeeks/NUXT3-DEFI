import { StaticJsonRpcRetryBatchProvider } from '@instadapp/utils'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ethers } from 'ethers'

const rpcInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}

export const useShared = defineStore('shared', () => {
  const rpcs = ref<Record<string, string>>({})
  const rpcList = ref<Record<string, string[]>>({})
  const isProd = ref(false)

  const isAppProduction = useCookie<boolean | undefined>('app-production', {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  })

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

    // console.trace(chainId)

    const list = rpcList.value[chainId] || rpcURL

    if (!list)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    if (!rpcInstances[chainId]) {
      rpcInstances[chainId] = new StaticJsonRpcRetryBatchProvider(list, {
        delay: 50,
        timeouts: [5000, 7000, 10000],
      })
    }

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
    rpcList,
    getRpcProviderByChainId,
    getRpcURLByChainId,
    isAppProduction,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
