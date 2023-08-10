export default defineNuxtPlugin(async () => {
  const shared = useShared()

  try {
    const data = await $fetch<Record<string, string>>('https://cdn.instadapp.io/avocado/rpc.json', {
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
