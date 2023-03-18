import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { setWeb3LibraryCallback } from "@instadapp/vue-web3";
import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { TorusConnector } from "@web3-react/torus-connector";
import { WalletLinkConnector } from "./custom/walletlink";
// const { networks } = useNetworks();

const POLLING_INTERVAL = 12000;

function getLibrary(provider: any) {
  let p = new Web3Provider(provider, "any");
  p.pollingInterval = POLLING_INTERVAL;
  return p;
}

function getAvoChainId() {
  if (process.client) {
    // useRuntimeConfig is not available for non setup files
    return window?.__NUXT__?.config?.public?.avocadoChainId;
  }
}

setWeb3LibraryCallback(getLibrary);

export const RPC_URLS: { [chainId: number]: string } = {
  1: "https://rpc.ankr.com/eth",
  137: "https://rpc.ankr.com/polygon",
  43114: "https://rpc.ankr.com/avalanche",
  // 250: 'https://rpc.ankr.com/fantom',
  10: "https://rpc.ankr.com/optimism",
  42161: "https://rpc.ankr.com/arbitrum",
  634: "https://rpc.avocado.instadapp.io",
  100: "https://rpc.ankr.com/gnosis",
  56: "https://rpc.ankr.com/bsc",
  // 250: 'https://rpc.ankr.com/fantom',
};

export const injected = new InjectedConnector({
  // supportedChainIds: [1, 3, 4, 5, 42, 56, 137]
});

export const walletlink = new WalletLinkConnector({
  appName: "Avocado",
  url: "https://avocado.instadapp.io",
  appLogoUrl:
    "https://raw.githubusercontent.com/InstaDApp/brand/master/instadapp%20logo%20only%20filled.svg",
  darkMode: false,
});

export const walletconnect = new WalletConnectConnector({
  rpc: RPC_URLS,
  chainId: getAvoChainId(),
  qrcode: true,
});

export const network = new NetworkConnector({
  urls: RPC_URLS,
  defaultChainId: 56,
});

export const torus = new TorusConnector({ chainId: 634 });

export const changeMetamaskNetwork = async (network: Network) => {
  const { library, chainId } = useWeb3();
  if (chainId.value !== network.chainId) {
    try {
      await library.value.send("wallet_switchEthereumChain", [
        { chainId: ethers.utils.hexValue(network.chainId) },
      ]);
      return Promise.resolve();
    } catch (err: any) {
      if (err.code === 4902) {
        try {
          await library.value.send("wallet_addEthereumChain", [
            {
              ...network.params,
              chainId: ethers.utils.hexValue(network.chainId),
            },
          ]);
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        return Promise.reject(err);
      }
    }
  }
};

export const changeNetworkWalletConnect = (network?: Network) => {
  let chainId = network ? network.chainId : 137;

  return new WalletConnectConnector({
    supportedChainIds: Object.keys(RPC_URLS).map(Number),
    rpc: RPC_URLS[chainId],
    chainId: chainId,
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
  });
};
