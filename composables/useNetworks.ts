import { ethers } from 'ethers'
import { storeToRefs } from 'pinia'
import {
  changeMetamaskNetwork,
  injected,
  walletconnect,
  walletlink,
} from '~~/connectors'
import SVGWalletlink from '~/assets/images/wallet/walletlink.svg'
import SVGMetamask from '~/assets/images/wallet/metamask.svg'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect.svg'

export function useNetworks() {
  const { chainId, provider, library } = useWeb3()
  const { rpcs } = storeToRefs(useShared())
  const { avoChainId } = storeToRefs(useEnvironmentState())

  const providers: Provider[] = [
    {
      get name() {
        return getInjectedName(window?.ethereum)
      },
      id: 'injected',
      logo: SVGMetamask,
      switchNetwork: async (network: Network) => {
        return await changeMetamaskNetwork(network)
      },
      connect: async () => {
        return injected()
      },
    },
    {
      name: 'Coinbase Wallet',
      id: 'walletlink',
      logo: SVGWalletlink,
      switchNetwork: async (network: Network) => {
        return await changeMetamaskNetwork(network)
      },
      connect: async () => {
        return walletlink(avoChainId.value)
      },
    },
    {
      name: 'WalletConnect',
      id: 'walletconnect',
      logo: SVGWalletConnect,
      switchNetwork: async (network: Network) => {
        return await changeMetamaskNetwork(network)
      },
      connect: async () => {
        return walletconnect(rpcs.value)
      },
    },
  ]

  const defaultNetwork = shallowRef(networks[0])

  const currentNetwork = computed({
    get(): Network {
      if (chainId.value) {
        return (
          networks.find(network => network.chainId === chainId.value)
          || defaultNetwork.value
        )
      }
      else {
        return defaultNetwork.value
      }
    },
    async set(value: Network) {
      try {
        if (provider.value.isMetaMask) {
          const provider = providers.find(i => i.name === 'Metamask')!
          await provider.switchNetwork(value)
          defaultNetwork.value = value
          useEagerConnect()
        }
        else {
          const provider = providers.find(i => i.name === 'WalletConnect')!
          await provider.switchNetwork(value)
          defaultNetwork.value = value
        }
      }
      catch (e) {
        console.log('Failed to change network', e)
      }
    },
  })

  const switchNetworkByChainId = async (chainId: number) => {
    const network = networks.find(i => i.chainId === Number(chainId))!

    // @ts-expect-error
    window.provider = library.value

    const cid = await library.value.getNetwork()
    if (cid.chainId === chainId)
      return

    try {
      await library.value.send('wallet_switchEthereumChain', [
        {
          chainId: ethers.utils.hexValue(network.chainId),
        },
      ])
      return Promise.resolve()
    }
    catch (err: any) {
      console.log(err, 'selam')
      try {
        await library.value.send('wallet_addEthereumChain', [
          {
            ...network.params,
            chainId: ethers.utils.hexValue(network.chainId),
          },
        ])
      }
      catch (err) {
        notify({
          type: 'error',
          title: 'Switch Network',
          message:
            'Failed to Switch Network, please add Avocado Network manually (<a class=\'underline text-slate-300 font-medium\' target=\'_blank\' href=\'https://guides.avocado.instadapp.io/getting-started/avocado-rpc\'>RPC details</a>).',
        })
        return Promise.reject(err)
      }
    }
    await nextTick()
  }

  const switchToAvocadoNetwork = () => {
    return switchNetworkByChainId(avoChainId.value)
  }

  return {
    providers,
    currentNetwork,
    switchNetworkByChainId,
    switchToAvocadoNetwork,
  }
}
