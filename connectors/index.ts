import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { setWeb3LibraryCallback } from "@instadapp/vue-web3";
import { Web3Provider } from "@ethersproject/providers";
import { ethers } from "ethers"

// const { networks } = useNetworks();

const POLLING_INTERVAL = 12000;

function getLibrary(provider: any) {

    let p = new Web3Provider(provider);
    p.pollingInterval = POLLING_INTERVAL;
    return p;
}

setWeb3LibraryCallback(getLibrary);

export const RPC_URLS: { [chainId: number]: string } = {
    1: 'https://rpc.ankr.com/eth',
    137: 'https://rpc.ankr.com/polygon',
    43114: 'https://rpc.ankr.com/avalanche',
    250: 'https://rpc.ankr.com/fantom',
    10: 'https://rpc.ankr.com/optimism',
    42161: 'https://rpc.ankr.com/arbitrum',
    420: 'https://rpc.avocado.instad.app',
};

export const injected = new InjectedConnector({
    // supportedChainIds: [1, 3, 4, 5, 42, 56, 137]
});

export const walletconnect = new WalletConnectConnector({
    rpc: RPC_URLS,
    chainId: 420,
    qrcode: true
});

export const network = new NetworkConnector({
    urls: { 1: RPC_URLS[1] },
    defaultChainId: 1
});

export const changeMetamaskNetwork = async (network: Network) => {
    if (window.ethereum.networkVersion !== network.chainId) {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: ethers.utils.hexValue(network.chainId)}],
            });
            return Promise.resolve();
        } catch (err: any) {
            if (err.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                ...network.params,
                                chainId: ethers.utils.hexValue(network.chainId),
                            },
                        ],
                    });
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
