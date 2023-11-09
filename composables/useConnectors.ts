import { storeToRefs } from 'pinia'
import { injected, walletconnect, walletlink } from '~~/connectors'

const providers = {
  // network,
  // torus,
  injected,
  walletlink,
  walletconnect,
}

export function useConnectors() {
  const { rpcs } = storeToRefs(useShared())
  const { deactivate, connector } = useWeb3()
  const { resetAccounts } = useSafe()

  const router = useRouter()

  const connectionMeta = useCookie<IConnectionMeta>('connection-meta', {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    default() {
      return {
        provider: null,
        address: '',
      }
    },
  })

  const cachedProviderName = computed(() => connectionMeta.value.provider)

  function onDisconnect() {
    const { terminateMFAToken } = useMfa()

    terminateMFAToken()

    resetAccounts()
    router.push('/login')

    connectionMeta.value.address = ''
    connectionMeta.value.provider = null

    if (connector.value)
      deactivate()
  }

  function setConnectorName(name: string | null) {
    connectionMeta.value.provider = name
  }

  function getConnector(): any {
    if (!process.client)
      return
    const cachedProvider = connectionMeta.value.provider

    return cachedProvider ? (providers as any)[cachedProvider]?.(rpcs.value) : null
  }

  return {
    setConnectorName,
    getConnector,
    cachedProviderName,
    onDisconnect,
    connectionMeta,
  }
}
