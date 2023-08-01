import { serialize } from 'error-serializer'
import { acceptHMRUpdate, defineStore } from 'pinia'
import type { IWeb3Wallet, Web3WalletTypes } from '@walletconnect/web3wallet'

import { Web3Wallet } from '@walletconnect/web3wallet'
import { Core } from '@walletconnect/core'
import type { SessionTypes } from '@walletconnect/types'
import { ethers } from 'ethers'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'

export const useWalletConnectV2 = defineStore('wallet_connect_v2', () => {
  const safe = useAvocadoSafe()
  const web3WalletV2 = shallowRef<IWeb3Wallet>()
  const sessions = ref<SessionTypes.Struct[]>([])
  const { account } = useWeb3()
  const { parseTransactionError } = useErrorHandler()
  const { switchToAvocadoNetwork } = useNetworks()

  const actualSessions = computed(() => sessions.value.filter((value) => {
    if (value.self.metadata.name === 'Avocado')
      return false

    return true
  }))

  function isSameOrigin(url1: string, url2: string) {
    try {
      const url = new URL(url1)
      const hostname = url.hostname
      const peerMetaUrl = new URL(url2)
      const peerMetaHostname = peerMetaUrl.hostname

      return hostname === peerMetaHostname
    }
    catch (e) {
      return false
    }
  }

  function checkDappIsBanned(peerURL: string) {
    return bannedDapps.some(i => isSameOrigin(i, peerURL))
  }

  function checkDappIsWarned(peerURL: string) {
    return warnedDapps.some(i => isSameOrigin(i, peerURL))
  }

  const prepareConnectV2 = async (
    uri: string,
  ) => {
    return new Promise<{
      sessionProposal: Web3WalletTypes.SessionProposal
      approvedNamespaces: SessionTypes.Namespaces
    }>((resolve, reject) => {
      web3WalletV2.value?.on('session_proposal', async (sessionProposal) => {
        try {
          const { params } = sessionProposal

          const chains = availableNetworks.map((network) => {
            return `eip155:${network.chainId}`
          })

          const requiredChains = params.requiredNamespaces.eip155.chains ?? []
          const requiredEvents = params.requiredNamespaces.eip155.events ?? []

          const mergedChains = [...new Set([...chains, ...requiredChains])]

          const accounts = mergedChains.map((network) => {
            return `${network}:${safe.safeAddress.value}`
          })

          const approvedNamespaces = buildApprovedNamespaces({
            proposal: params,
            supportedNamespaces: {
              eip155: {
                chains: mergedChains,
                accounts,
                methods: [
                  ...signingMethods,
                  ...requiredEvents,
                  'eth_sendAvocadoTransaction',
                  'eth_sendAvocadoTransactions',
                  'eth_getBalance',
                  'avocado_sendTransaction',
                  'avocado_sendTransactions',
                  'avocado_getOwner',
                ],
                events: ['accountsChanged', 'chainChanged'],
              },
            },
          })
          resolve({
            sessionProposal,
            approvedNamespaces,
          })
        }
        catch (e) {
          const err = serialize(e)
          console.log(err, 'selam')
          reject(e)
        }
      })

      web3WalletV2.value?.core.pairing.pair({ uri }).catch((e) => {
        reject(e)
      })
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
      metadata: walletConnectMetadata,
    })

    web3WalletV2.value.on('session_delete', async (event) => {
      syncActiveSessions()
    })

    web3WalletV2.value.on('session_request', async (event) => {
      const { topic, params, id } = event
      const { request } = params

      console.log({ request }, 'session_request')

      const chainId = normalizeChainId(event.params.chainId)

      const session = sessions.value.find((session) => {
        return session.topic === topic
      })

      Object.assign(params.request, {
        id,
      })

      if (!web3WalletV2.value || !session)
        return

      if (!availableNetworks.find(n => String(n.chainId) == String(chainId))) {
        return web3WalletV2.value.respondSessionRequest({
          topic: session.topic,
          response: {
            id,
            jsonrpc: '2.0',
            error: getSdkError('UNSUPPORTED_CHAINS'),
          },
        })
      }

      if (request.method === 'wallet_addEthereumChain' || request.method === 'wallet_switchEthereumChain') {
        return web3WalletV2.value.respondSessionRequest({
          topic: session.topic,
          response: {
            id,
            jsonrpc: '2.0',
            result: null,
          },
        })
      }

      const metadata = encodeDappMetadata({
        name: session?.peer?.metadata?.name!,
        url: session?.peer?.metadata?.url!,
      })

      const response = (result: any) => {
        return { id, result, jsonrpc: '2.0' }
      }

      if (request.method === 'eth_getBalance') {
        web3WalletV2.value.respondSessionRequest({
          topic,
          response: response('0x0de0b6b3a7640000'),
        })
      }
      else if (request.method === 'eth_requestAccounts') {
        response.result = [safe.safeAddress.value]

        web3WalletV2.value.respondSessionRequest({
          topic,
          response: response([safe.safeAddress.value]),
        })
      }

      else if (request.method === 'avocado_getOwner') {
        web3WalletV2.value.respondSessionRequest({
          topic,
          response: response(account.value),
        })
      }
      else if (
        [
          'eth_sendAvocadoTransaction',
          'eth_sendAvocadoTransactions',
          'avocado_sendTransaction',
          'avocado_sendTransactions',
        ].includes(request.method)
      ) {
        try {
          const { success, payload: msg }
                    = await openWCTransactionModal({
                      payload: params.request,
                      chainId,
                      sessionV2: session,
                      metadata,
                    })

          if (!success) {
            web3WalletV2.value.respondSessionRequest({
              topic: session.topic,
              response: {
                id,
                jsonrpc: '2.0',
                error: {
                  code: 5000,
                  message: msg,
                },
              },
            })
          }
        }
        catch (error: any) {
          const err = parseTransactionError(error)

          web3WalletV2.value.respondSessionRequest({
            topic: session.topic,
            response: {
              id,
              jsonrpc: '2.0',
              error: {
                code: error.code || 5000,
                message: err.parsed,
              },
            },
          })
        }
      }
      else if (request.method === 'eth_sendTransaction') {
        console.log(event.params)
        const { success, payload: msg } = await openWCTransactionModal({
          payload: params.request,
          chainId,
          sessionV2: session,
          metadata,
        })

        if (!success) {
          web3WalletV2.value.respondSessionRequest({
            topic: session.topic,
            response: {
              id,
              jsonrpc: '2.0',
              error: {
                code: 5000,
                message: msg || 'User rejected.',
              },
            },
          })
        }
      }
      else if (
        request.method === 'eth_signTypedData_v4'
                && String(params.request.params[0]).toLowerCase()
                  === String(safe.safeAddress.value).toLowerCase()
      ) {
        const eip712Data = JSON.parse(params.request.params[1])
        if (
          eip712Data.domain.verifyingContract.toLowerCase()
                  === '0x000000000022d473030f116ddee9f6b43ac78ba3'
        ) {
          await switchToAvocadoNetwork()
          delete eip712Data.types.EIP712Domain

          const permit2ABI = [
            'function approve(address token, address spender, uint160 amount, uint48 expiration) external',
          ]
          const approvePermit2Calldata = new ethers.utils.Interface(
            permit2ABI,
          ).encodeFunctionData('approve', [
            eip712Data.message.details.token,
            eip712Data.message.spender,
            eip712Data.message.details.amount,
            eip712Data.message.details.expiration,
          ])
          const actions = [
            {
              // Permit2 Allowance
              to: eip712Data.domain.verifyingContract.toLowerCase(),
              data: approvePermit2Calldata,
              operation: '0',
              value: '0',
            },
          ]

          try {
            const metadata = encodeWCSignMetadata({
              amount: eip712Data.message.details.amount,
              token: eip712Data.message.details.token,
              spender: eip712Data.message.spender,
              expiration: eip712Data.message.details.expiration,
            })

            params.request.params = actions

            const { success, payload: msg }
                      = await openWCTransactionModal({
                        chainId,
                        payload: params.request,
                        sessionV2: session,
                        metadata,
                        isSign: true,
                        signMessageDetails: eip712Data.message.details,
                      })

            if (!success) {
              web3WalletV2.value.respondSessionRequest({
                topic: session.topic,
                response: {
                  id,
                  jsonrpc: '2.0',
                  error: {
                    code: 5000,
                    message: msg || 'User rejected.',
                  },
                },
              })
            }
          }
          catch (error: any) {
            const err = parseTransactionError(error)

            web3WalletV2.value.respondSessionRequest({
              topic: session.topic,
              response: {
                id,
                jsonrpc: '2.0',
                error: {
                  code: 5000,
                  message: err.formatted,
                },
              },
            })

            notify({
              type: 'error',
              title: 'Transaction sign failed',
            })
          }
        }
        else {
          // throw not allowed
          web3WalletV2.value.respondSessionRequest({
            topic: session.topic,
            response: {
              id,
              jsonrpc: '2.0',
              error: {
                code: 5000,
                message: 'Not allowed',
              },
            },
          })
        }
      }
      // @todo: will fill in later

      // else if (
      //   signingMethods.includes(request.method)
      //   // payload.method === "personal_signx"
      // ) {
      //   await switchNetworkByChainId(+chainId)

      //   const params = request.params

      //   try {
      //     const result = await library.value.send(
      //       request.method,
      //       params,
      //     )

      //     web3WalletV2.value.respondSessionRequest({
      //       topic: session.topic,
      //       response: {
      //         id,
      //         result,
      //         jsonrpc: '2.0',
      //       },
      //     })
      //   }
      //   catch (error: any) {
      //     web3WalletV2.value.respondSessionRequest({
      //       topic: session.topic,
      //       response: {
      //         id,
      //         jsonrpc: '2.0',
      //         error: {
      //           code: 5000,
      //           message: error?.message,
      //         },
      //       },
      //     })
      //   }
      // }
      else {
        const resp = await http(getRpcURLByChainId(chainId), {
          method: 'POST',
          body: {
            payload: request,
          },
        })

        web3WalletV2.value.respondSessionRequest({
          topic: session.topic,
          response: {
            id,
            result: resp.result,
            jsonrpc: '2.0',
          },
        })
      }

      // console.log(request)
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
    for (const connector of actualSessions.value)
      await disconnect(connector)
  }

  onMounted(async () => {
    await init()

    syncActiveSessions()
  })

  watch(safe.safeAddress, async () => {
    await disconnectAll()
    syncActiveSessions()
  })

  const normalizeChainId = (eip155ChainId: string) => {
    return eip155ChainId.replace('eip155:', '')
  }

  function getConnectionVersion(uri: string): 1 | 2 {
    const v1Pattern = /^wc:[a-zA-Z0-9-]+@1\?/
    const v2Pattern = /^wc:[a-zA-Z0-9]+@2\?/

    if (v1Pattern.test(uri))
      return 1

    else if (v2Pattern.test(uri))
      return 2

    else
      throw new Error('Invalid connection URI')
  }

  return {
    prepareConnectV2,
    sessions: actualSessions,
    init,
    disconnect,
    connect,
    disconnectAll,
    web3WalletV2,
    getConnectionVersion,
    checkDappIsBanned,
    checkDappIsWarned,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useWalletConnectV2, import.meta.hot))
