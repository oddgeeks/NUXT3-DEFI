import { slackIt } from '~~/server/utils'

export default defineNuxtPlugin(async () => {
  const shared = useShared()

  try {
    const data = await $fetch<Record<string, string>>('https://rpc.instadapp.io/rpc', {
      retry: 3,
    })

    shared.rpcs = data as Record<string, string>

    return {
      provide: {
        RPCMap: data,
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
