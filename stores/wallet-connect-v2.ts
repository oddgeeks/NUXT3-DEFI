import { acceptHMRUpdate, defineStore } from 'pinia'
import type { IWeb3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'

import { Web3Wallet } from '@walletconnect/web3wallet'
import { Core } from '@walletconnect/core'
import type { SessionTypes } from '@walletconnect/types'
import { buildApprovedNamespaces } from '../utils/wc/namespaces'
import { getSdkError } from '~/utils/wc'

export const useWalletConnectV2 = defineStore('wallet_connect_v2', () => {
  const safe = useAvocadoSafe()
  const web3WalletV2 = shallowRef<IWeb3Wallet>()
  const sessions = ref<SessionTypes.Struct[]>([])

  const prepareConnectV2 = async (
    uri: string,
  ) => {
    return new Promise<{
      sessionProposal: Web3WalletTypes.SessionProposal
      approvedNamespaces: SessionTypes.Namespaces
    }>((resolve) => {
      web3WalletV2.value?.on('session_proposal', async (sessionProposal) => {
        const { params } = sessionProposal

        const chains = availableNetworks.map((network) => {
          return `eip155:${network.chainId}`
        })

        const accounts = availableNetworks.map((network) => {
          return `eip155:${network.chainId}:${safe.safeAddress.value}`
        })

        const approvedNamespaces = buildApprovedNamespaces({
          proposal: params,
          supportedNamespaces: {
            eip155: {
              chains,
              accounts,
              methods: [
                ...signingMethods,
                ...params.requiredNamespaces?.eip155.methods,
                'eth_sendAvocadoTransaction',
                'eth_sendAvocadoTransactions',
                'eth_getBalance',
                'avocado_sendTransaction',
                'avocado_sendTransactions',
              ],
              events: ['accountsChanged', 'chainChanged'],
            },
          },
        })

        resolve({
          sessionProposal,
          approvedNamespaces,
        })
      })

      web3WalletV2.value?.core.pairing.pair({ uri })
    })
  }

  const syncActiveSessions = async () => {
    const sessionObjects = await web3WalletV2.value?.getActiveSessions() ?? {}

    sessions.value = Object.entries(sessionObjects).map(([key, value]) => {
      return value
    })
  }

  const init = async () => {
    web3WalletV2.value = await Web3Wallet.init({
      core: new Core({
        projectId: '42e9e3b646c9102371bd147b3e960c39',
      }),
      metadata: {
        description: 'Instadapp Avocado - Safe',
        url: 'https://avocado.instadapp.io',
        icons: ['https://avocado.instadapp.io/logo.png'],
        name: 'Instadapp Avocado',
      },
    })

    web3WalletV2.value.on('session_delete', async (event) => {
      syncActiveSessions()
    })

    web3WalletV2.value.on('session_request', async (event) => {
      const { topic, params, id } = event
      const { request } = params

      console.log(request)

      // const rpcParams = request.params

      // console.log(topic, params, id)
      // console.log(rpcParams)

      // const response = { id, result: '0x', jsonrpc: '2.0' }

      // await web3WalletV2.value!.respondSessionRequest({ topic, response })
    })
  }

  const connect = async (proposal: Web3WalletTypes.SessionProposal, approvedNamespaces: SessionTypes.Namespaces) => {
    await web3WalletV2.value?.approveSession({
      id: proposal.id,
      namespaces: approvedNamespaces,
    })

    syncActiveSessions()
  }

  const disconnect = async (session: SessionTypes.Struct) => {
    await web3WalletV2.value?.disconnectSession({
      topic: session.topic,
      reason: getSdkError('USER_DISCONNECTED'),
    })

    syncActiveSessions()
  }

  const disconnectAll = async () => {
    for (const connector of sessions.value)
      await disconnect(connector)
  }

  onMounted(async () => {
    await init()

    syncActiveSessions()
  })

  return {
    prepareConnectV2,
    sessions,
    init,
    disconnect,
    connect,
    disconnectAll,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWalletConnectV2, import.meta.hot))
