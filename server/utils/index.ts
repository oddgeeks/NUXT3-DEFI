import { ethers } from "ethers";

export const RPC_URLS: { [chainId: number]: string } = {
    137: process.env.POLYGON_RPC_URL || "https://rpc.ankr.com/polygon",
    10: process.env.OPTIMISM_RPC_URL || "https://rpc.ankr.com/optimism",
    42161: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    634: "https://rpc.avocado.instadapp.io",
    63400: "https://rpc.avocado.instad.app",
    1: process.env.MAINNET_RPC_URL || "https://rpc.ankr.com/eth",
    43114: process.env.AVALANCHE_RPC_URL || "https://rpc.ankr.com/avalanche",
    100: process.env.GNOSIS_RPC_URL || "https://rpc.ankr.com/gnosis",
    56: process.env.BSC_RPC_URL || "https://rpc.ankr.com/bsc",
    1101: process.env.POLYGON_ZKEVM_RPC_URL || "https://rpc.ankr.com/polygon_zkevm",
};

const rpcInstances: Record<string, ethers.providers.JsonRpcProvider> = {};

export const getServerRpcProvider = (chainId: number | string) => {
    if (!rpcInstances[chainId]) {
        rpcInstances[chainId] = new ethers.providers.JsonRpcProvider(
            RPC_URLS[Number(chainId)]
        );
    }

    return rpcInstances[chainId];
};