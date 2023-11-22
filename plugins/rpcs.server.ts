import { slackIt } from '~~/server/utils'

export default defineNuxtPlugin(async () => {
  const shared = useShared()

  try {
    const blockqueryNetworks = await $fetch<IBlockQueryChain[]>('https://blockquery.instadapp.io/chains', {
      retry: 3,
    })

    shared.rpcList = networks.reduce((acc, network) => {
      const blockqueryRpcList = blockqueryNetworks.find(i => String(i.id) == String(network.chainId))?.free_rpc_urls
      const fallbackRpcList = network?.params?.rpcUrls

      const rpcList = blockqueryRpcList || fallbackRpcList

      acc[network.chainId]
        = rpcList
      return acc
    }, {} as Record<string, string[]>)

    return { }
  }
  catch (e) {
    // fallback rpc
    slackIt('error', {
      message: 'RPCs CDN failed, fallback to default',
      title: 'CDN Failed',
    })

    shared.rpcList = networks.reduce((acc, network) => {
      acc[network.chainId] = network.params.rpcUrls
      return acc
    }, {} as Record<string, string[]>)

    return { }
  }
})
