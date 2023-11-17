import { storeToRefs } from 'pinia'
import { injected, walletconnect, walletlink } from '~~/connectors'

const providers = {
  // network,
  injected,
  walletlink,
  walletconnect,
}

export function useConnectors() {
  const { rpcs } = storeToRefs(useShared())
  const { deactivate, connector, account } = useWeb3()
  const { resetAccounts } = useSafe()

  const router = useRouter()

  const connectionMeta = useCookie<IConnectionMeta>('connection-meta', {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    default() {
      return {
        provider: null,
      }
    },
  })

  const cachedProviderName = computed(() => connectionMeta.value.provider)

  function onDisconnect() {
    const { terminateMFAToken } = useMfa()

    const userNonce = useCookie<string | null>(`nonce-${account.value}`)

    userNonce.value = null

    terminateMFAToken()

    resetAccounts()
    router.push('/login')

    connectionMeta.value.provider = null

    if (connector.value)
      deactivate()
  }

  function setConnectorName(name: string | null) {
    const obj = {
      provider: name,
    }

    connectionMeta.value = obj
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
