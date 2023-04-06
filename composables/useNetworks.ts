import {
  changeMetamaskNetwork,
  injected,
  walletlink,
  changeNetworkWalletConnect,
} from "~~/connectors";
import SVGWalletlink from "~/assets/images/wallet/walletlink.svg?component";
import SVGMetamask from "~/assets/images/wallet/metamask.svg?component";
import SVGWalletConnect from "~/assets/images/wallet/wallet-connect.svg?component";
import { ethers } from "ethers";

export function useNetworks() {
  const { chainId, provider, library } = useWeb3();

  const providers: Provider[] = [
    {
      name: "Metamask",
      id: "injected",
      logo: SVGMetamask,
      switchNetwork: async (network: Network) => {
        return await changeMetamaskNetwork(network);
      },
      connect: async () => {
        return injected;
      },
    },
    {
      name: "Coinbase Wallet",
      id: "walletlink",
      logo: SVGWalletlink,
      switchNetwork: async (network: Network) => {
        return await changeMetamaskNetwork(network);
      },
      connect: async () => {
        return walletlink;
      },
    },
    {
      name: "WalletConnect",
      id: "walletconnect",
      logo: SVGWalletConnect,
      switchNetwork: async (network: Network) => {
        return await changeNetworkWalletConnect(network);
      },
      connect: async () => {
        //@ts-ignore
        window.wc = changeNetworkWalletConnect();

        return changeNetworkWalletConnect();
      },
    },
  ];

  const defaultNetwork = shallowRef(networks[0]);

  const currentNetwork = computed({
    get(): Network {
      if (chainId.value) {
        return (
          networks.find((network) => network.chainId === chainId.value) ||
          defaultNetwork.value
        );
      } else {
        return defaultNetwork.value;
      }
    },
    async set(value: Network) {
      try {
        if (provider.value.isMetaMask) {
          const provider = providers.find((i) => i.name === "Metamask")!;
          await provider.switchNetwork(value);
          defaultNetwork.value = value;
          useEagerConnect();
        } else {
          const provider = providers.find((i) => i.name === "WalletConnect")!;
          await provider.switchNetwork(value);
          defaultNetwork.value = value;
        }
      } catch (e) {
        console.log("Failed to change network", e);
      }
    },
  });

  const switchNetworkByChainId = async (chainId: number) => {
    const network = networks.find((i) => i.chainId === Number(chainId))!;

    //@ts-ignore
    window.provider = library.value;

    const cid = await library.value.getNetwork();
    if (cid.chainId === chainId) {
      return;
    }

    try {
      await library.value.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexValue(network.chainId) },
      ]);
      return Promise.resolve();
    } catch (err: any) {
      console.log(err);
      try {
        await library.value.send("wallet_addEthereumChain", [
          {
            ...network.params,
            chainId: ethers.utils.hexValue(network.chainId),
          },
        ]);
      } catch (err) {
        notify({
          type: "error",
          title: "Switch Network",
          message:
            "Failed to Switch Network, please add Avocado Network manually (<a class='underline text-slate-300 font-medium' target='_blank' href='https://help.avocado.instadapp.io/en/articles/7037876-what-are-avocado-s-rpc-details'>RPC details</a>).",
        });
        return Promise.reject(err);
      }
    }
    await nextTick();
  };

  const switchToAvocadoNetwork = () => {
    return switchNetworkByChainId(avoChainId);
  };

  return {
    providers,
    currentNetwork,
    switchNetworkByChainId,
    switchToAvocadoNetwork,
  };
}
