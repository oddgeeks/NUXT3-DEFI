import type { IToken } from "~~/stores/tokens";

type IProviderToken = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  extensions: object;
};

interface IProviderResponse {
  name: string;
  timestamp: string;
  version: any;
  tags: any;
  logoURI: string;
  keywords: string[];
  tokens: IProviderToken[];
}

const formatIPFS = (ipfs: string) => {
  if (ipfs.startsWith("ipfs") || ipfs.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${ipfs.replace("ipfs://", "")}`;
  }
  return ipfs;
};

export default defineEventHandler<IToken[]>(async (event) => {
  const providers = [
    // Mainnet
    {
      name: "Uniswap Labs List",
      url: "https://tokens.uniswap.org/",
    },
    {
      name: "Coinmarketcap",
      url: "https://api.coinmarketcap.com/data-api/v3/uniswap/all.json",
    },
    // Polygon
    {
      name: "Comethswap",
      url: "https://unpkg.com/@cometh-game/default-token-list@1.0.40/build/comethswap-default.tokenlist.json"
    },
    {
      name: "Quickswap",
      url: "https://unpkg.com/quickswap-default-token-list@1.2.65/build/quickswap-default.tokenlist.json"
    },
    // BSC
    {
      name: 'PancakeSwap',
      url: 'https://tokens.pancakeswap.finance/pancakeswap-extended.json',
    },
    // Optimism
    {
      name: 'Optimism',
      url: 'https://static.optimism.io/optimism.tokenlist.json',
    },
    // Arbitrum
    {
      name: 'Arbitrum',
      url: 'https://bridge.arbitrum.io/token-list-42161.json',
    },
    // Avalanche
    {
      name: 'Pangolin',
      url: 'https://raw.githubusercontent.com/pangolindex/tokenlists/main/pangolin.tokenlist.json',
    },
    // Gnosis
  ];

  const results = await Promise.allSettled(
    providers.map((provider) => $fetch(provider.url))
  );

  const tokens = results.reduce((acc: any, result) => {
    if (result.status === "fulfilled") {
      const value = result.value as IProviderResponse;

      const tokens: IToken[] = value.tokens
        .map((token) => {
          return {
            address: token.address,
            chainId: String(token.chainId),
            decimals: token.decimals,
            logoURI: token.logoURI ? formatIPFS(token.logoURI) : "",
            name: token.name,
            symbol: token.symbol,
            price: null,
            coingeckoId: null,
            sparklinePrice7d: [],
          };
        })
        .filter(
          (token) =>
            acc.findIndex(
              (t: IToken) =>
                t.address.toLowerCase() === token.address.toLowerCase() &&
                t.chainId == token.chainId
            ) === -1
        );

      return [...acc, ...tokens];
    }
    return acc;
  }, []);

  return tokens;
});
