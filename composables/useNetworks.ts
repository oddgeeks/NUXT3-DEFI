import SVGMainnet from "~/assets/images/logo/mainnet.svg?component";
import SVGPolygon from "~/assets/images/logo/polygon.svg?component";
import SVGArbitrum from "~/assets/images/logo/arbitrum.svg?component";
import SVGOptimism from "~/assets/images/logo/optimism.svg?component";
import SVGAvalanche from "~/assets/images/logo/avalanche.svg?component";
import SVGMetamask from "~/assets/images/wallet/metamask.svg?component";
import SVGWalletConnect from "~/assets/images/wallet/wallet-connect.svg?component";
import SVGMagicConnect from "~/assets/images/wallet/magic.svg?component";
import { ethers } from "ethers";

export function useNetworks() {
  const { chainId, provider, library } = useWeb3();

  const providers: Provider[] = [
    {
      name: "Metamask",
      logo: SVGMetamask,
      switchNetwork: async (network: Network) => {
        const { changeMetamaskNetwork } = await import("~/connectors");
        return await changeMetamaskNetwork(network);
      },
      connect: async () => {
        const { injected } = await import("~/connectors");
        return injected;
      },
    },
    {
      name: "WalletConnect",
      logo: SVGWalletConnect,
      switchNetwork: async (network: Network) => {
        const { changeNetworkWalletConnect } = await import("~/connectors");
        return await changeNetworkWalletConnect(network);
      },
      connect: async () => {
        const { changeNetworkWalletConnect } = await import("~/connectors");

        //@ts-ignore
        window.wc = changeNetworkWalletConnect();

        return changeNetworkWalletConnect();
      },
    },
    // {
    //     name: "Torus",
    //     logo: SVGMetamask,
    //     switchNetwork: async (network: Network) => {
    //     },
    //     connect: async () => {
    //         const { torus } = await import("~/connectors");
    //         return torus;
    //     },
    // },
    {
      name: "Magic",
      logo: SVGMagicConnect,
      switchNetwork: async (network: Network) => {},
      connect: async () => {
        const { magic } = await import("~/connectors");

        return magic("georges.kabbouchi@gmail.com");
      },
    },
  ];

  const networks: Network[] = [
    {
      name: "Mainnet",
      chainId: 1,
      icon: SVGMainnet,
      params: {
        rpcUrls: ["https://rpc.ankr.com/eth"],
      },
    },
    {
      name: "Polygon",
      chainId: 137,
      icon: SVGPolygon,
      params: {
        chainName: "Matic(Polygon) Mainnet",
        nativeCurrency: {
          name: "Matic",
          symbol: "MATIC",
          decimals: 18,
        },
        rpcUrls: ["https://polygon-rpc.com"],
        blockExplorerUrls: ["https://polygonscan.com/"],
      },
    },
    {
      name: "Arbitrum",
      chainId: 42161,
      icon: SVGArbitrum,
      params: {
        chainName: "Arbitrum One",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://arb1.arbitrum.io/rpc"],
        blockExplorerUrls: ["https://arbiscan.io"],
      },
    },
    {
      name: "Optimism",
      chainId: 10,
      icon: SVGOptimism,
      params: {
        chainName: "Optimistic Ethereum",
        nativeCurrency: {
          name: "Ethereum",
          symbol: "ETH",
          decimals: 18,
        },
        rpcUrls: ["https://mainnet.optimism.io"],
        blockExplorerUrls: ["https://optimistic.etherscan.io"],
      },
    },
    {
      name: "Avalanche",
      chainId: 43114,
      icon: SVGAvalanche,
      params: {
        chainName: "Avalanche Network",
        nativeCurrency: {
          name: "Avalanche",
          symbol: "AVAX",
          decimals: 18,
        },
        rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
        blockExplorerUrls: ["https://snowtrace.io/"],
      },
    },
    {
      name: "Avocado",
      chainId: 75,
      icon: SVGPolygon,
      params: {
        chainName: "Avocado Network",
        nativeCurrency: {
          name: "Avocado",
          symbol: "USDC",
          decimals: 18,
        },
        rpcUrls: ["https://rpc.avocado.link/"],
      },
    },
    {
      name: "BSC",
      chainId: 56,
      icon: SVGPolygon,
      params: {
        chainName: "Binance Smart Chain",
      },
    },
    {
      name: "Gnosis",
      chainId: 1,
      icon: SVGPolygon,
      params: {
        chainName: "Gnosis Safe",
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
            "Failed to switch network, please add avocado network manualy then reconnect.",
        });
        return Promise.reject(err);
      }
    }
    await nextTick();
  };

  return {
    networks,
    providers,
    currentNetwork,
    switchNetworkByChainId,
  };
}
