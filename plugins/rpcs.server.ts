import { slackIt } from '~~/server/utils'

export default defineNuxtPlugin(async () => {
  const shared = useShared()

  try {
    const [rpcs, rpcList] = await Promise.all([
      $fetch<Record<string, string>>('https://rpc.instadapp.io/rpc', {
        retry: 3,
      }),
      $fetch<Record<string, string[]>>('https://cdn.instadapp.io/avocado/rpcs.json', {
        retry: 3,
      })])

    shared.rpcs = rpcs as Record<string, string>
    shared.rpcList = rpcList as Record<string, string[]>

    return {
      provide: {
        RPCMap: rpcs,
      },
    }
  }
  catch (e) {
    // fallback rpc
    slackIt('error', {
      message: 'RPCs CDN failed, fallback to default',
      title: 'CDN Failed',
    })
    const rpcMap = networks.reduce((acc, network) => {
      acc[network.chainId] = network.params.rpcUrls[0]
      return acc
    }, {} as Record<string, string>)

    shared.rpcs = rpcMap

    return {
      provide: {
        RPCMap: rpcMap,
      },
    }
  }

  return {}
})
