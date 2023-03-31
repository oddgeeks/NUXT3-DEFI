import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { setWeb3LibraryCallback } from "@instadapp/vue-web3";
import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { TorusConnector } from "@web3-react/torus-connector";
import { WalletLinkConnector } from "./custom/walletlink";
import { avoChainId } from "../utils/avocado";
import { RPCMap, networkIds, getRpcURLByChainId } from "../utils/network";
// const { networks } = useNetworks();

const POLLING_INTERVAL = 12000;

function getLibrary(provider: any) {
  let p = new Web3Provider(provider, "any");
  p.pollingInterval = POLLING_INTERVAL;
  return p;
}

setWeb3LibraryCallback(getLibrary);

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
  rpc: RPCMap,
  chainId: avoChainId,
  qrcode: true,
});

export const network = new NetworkConnector({
  urls: RPCMap,
  defaultChainId: 56,
});

export const torus = new TorusConnector({
  chainId: avoChainId,
});

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
    supportedChainIds: networkIds,
    rpc: getRpcURLByChainId(chainId),
    chainId: chainId,
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
  });
};
