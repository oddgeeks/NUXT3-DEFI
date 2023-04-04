import { ethers } from "ethers";
import {
  AVO_PROD_CHAIN_NAME,
  AVO_PROD_CHAIN_ID,
  AVO_STAGING_CHAIN_NAME,
  AVO_STAGING_RPC_URL,
  AVO_PROD_RPC_URL,
  AVO_STAGING_CHAIN_ID,
} from "./avocado";

export const bridgeDisabledNetworks = [1101];

export const networks: Network[] = [
  {
    name: "Mainnet",
    chainId: 1,
    params: {
      rpcUrls: ["https://rpc.ankr.com/eth"],
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
    },
  },
  {
    name: "Polygon",
    chainId: 137,
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
    name: "BSC",
    chainId: 56,
    params: {
      chainName: "Binance Smart Chain",
      rpcUrls: ["https://rpc.ankr.com/bsc"],
      nativeCurrency: {
        name: "Binance Coin",
        symbol: "BNB",
        decimals: 18,
      },
    },
  },
  {
    name: "Gnosis",
    chainId: 100,
    params: {
      chainName: "Gnosis Safe",
      rpcUrls: ["https://rpc.ankr.com/gnosis"],
      nativeCurrency: {
        name: "xdaistable",
        symbol: "xDAI",
        decimals: 18,
      },
    },
  },
  {
    name: "Polygon zkEVM",
    chainId: 1101,
    params: {
      chainName: "polygon zkEVM",
      rpcUrls: ["https://rpc.ankr.com/polygon_zkevm"],
      nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
      },
    },
  },
  {
    name: AVO_PROD_CHAIN_NAME,
    chainId: AVO_PROD_CHAIN_ID,
    params: {
      chainName: AVO_PROD_CHAIN_NAME,
      nativeCurrency: {
        name: "Avocado",
        symbol: "USDC",
        decimals: 18,
      },
      iconUrls: ["https://avocado.instadapp.io/logo.svg"],
      rpcUrls: [AVO_PROD_RPC_URL],
      blockExplorerUrls: ["https://avocado.instadapp.io"],
    },
  },
  {
    name: AVO_STAGING_CHAIN_NAME,
    chainId: AVO_STAGING_CHAIN_ID,
    params: {
      chainName: AVO_STAGING_CHAIN_NAME,
      nativeCurrency: {
        name: "Avocado",
        symbol: "USDC",
        decimals: 18,
      },
      iconUrls: ["https://avocado.instadapp.io/logo.svg"],
      rpcUrls: [AVO_STAGING_RPC_URL],
      blockExplorerUrls: ["https://avocado.instadapp.io"],
    },
  },
];

export const getExplorerUrl = (
  chainId: ChainId,
  suffix: `/${string}` = "/"
) => {
  switch (String(chainId)) {
    case "1":
      return "https://etherscan.io" + suffix;
    case "137":
      return "https://polygonscan.com" + suffix;
    case "43114":
      return "https://snowtrace.io" + suffix;
    case "10":
      return "https://optimistic.etherscan.io" + suffix;
    case "42161":
      return "https://arbiscan.io" + suffix;
    case "250":
      return "https://ftmscan.com" + suffix;
    case "56":
      return "https://bscscan.com" + suffix;
    case "1101":
      return "https://zkevm.polygonscan.com" + suffix;
    case "100":
      return "https://gnosisscan.io" + suffix;
    case "1102":
      return "https://zkevm.polygonscan.com" + suffix;
  }
};

export const getNetworkByChainId = (
  chainId: Network["chainId"] | number | string
) => {
  return networks.find((i) => i.chainId === Number(chainId))!;
};

export const availableNetworks = networks.filter(
  (network) =>
    network.chainId != AVO_STAGING_CHAIN_ID &&
    network.chainId != AVO_PROD_CHAIN_ID
);

export const chainIdToName = (chainId: ChainId | number | string) => {
  const network = getNetworkByChainId(chainId);
  return network.name;
};

export const getRpcURLByChainId = (chainId: ChainId | number | string) => {
  const network = getNetworkByChainId(chainId);
  return network.params.rpcUrls[0];
};

export const RPCMap = networks.reduce((acc, network) => {
  acc[network.chainId] = network.params.rpcUrls[0];
  return acc;
}, {} as Record<number, string>);

export const networkIds = networks.map((network) => network.chainId);

const rpcInstances: Record<string, ethers.providers.JsonRpcProvider> = {};

export const getRpcProvider = (chainId: number | string) => {
  if (!rpcInstances[chainId]) {
    rpcInstances[chainId] = new ethers.providers.JsonRpcProvider(
      getRpcURLByChainId(Number(chainId))
    );
  }

  return rpcInstances[chainId];
};
