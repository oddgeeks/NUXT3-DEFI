export default defineNuxtPlugin(async () => {
  try {
    const shared = useShared()
    const data = await $fetch<Record<string, string>>('https://cdn.instadapp.io/avocado/rpc.json', {
      retry: 3,
    })

    // temporary fix
    data['1313161554'] = 'https://mainnet.aurora.dev'
    data[AVO_PROD_CHAIN_ID] = AVO_PROD_RPC_URL
    data[AVO_STAGING_CHAIN_ID] = AVO_STAGING_RPC_URL

    shared.rpcs = data as Record<string, string>

    return {
      provide: {
        RPCMap: data,
      },
    }
  }
  catch (e) {
    console.error(e)
  }

  return {}
})
