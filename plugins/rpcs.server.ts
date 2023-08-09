export default defineNuxtPlugin(async () => {
  try {
    const shared = useShared()
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
    console.error(e)
  }

  return {}
})
