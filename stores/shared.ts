import { StaticJsonRpcRetryBatchProvider } from '@instadapp/utils'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { ethers } from 'ethers'

const rpcInstances: Record<string, ethers.providers.StaticJsonRpcProvider> = {}

export const useShared = defineStore('shared', () => {
  const rpcList = ref<Record<string, string[]>>({})
  const isProd = ref(false)

  const rpcs = computed(() => networks.reduce((acc, network) => {
    acc[network.chainId] = network.params.rpcUrls[0]
    return acc
  }, {} as Record<string, string>))

  const isAppProduction = useCookie<boolean | undefined>('app-production', {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
  })

  function getRpcProviderByChainId(chainId: number | string) {
    const list = rpcList.value[chainId]

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
    const list = rpcList.value[chainId]

    if (!list?.length)
      throw new Error(`No RPC URL for chainId: ${chainId}`)

    return list[0]
  }

  return {
    isProd,
    rpcs,
    rpcList,
    getRpcProviderByChainId,
    getRpcURLByChainId,
    isAppProduction,
    transactionStack,
    addToTransactionStack,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useShared, import.meta.hot))
