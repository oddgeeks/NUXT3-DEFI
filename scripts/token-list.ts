import { $fetch } from "ohmyfetch";
import { writeJson, existsSync } from "fs-extra";
import { resolve } from "path";
import { ethers } from "ethers";
import { StaticJsonRpcRetryProvider } from "@instadapp/utils";
import dotenv from "dotenv";
dotenv.config();

const COINGECKO_BASE_API = process.env.COINGECKO_KEY
  ? "https://pro-api.coingecko.com/api/v3"
  : "https://api.coingecko.com/api/v3";

const RPC_URLS: { [chainId: number]: string } = {
  1: "https://rpc.ankr.com/eth",
  137: "https://rpc.ankr.com/polygon",
  43114: "https://rpc.ankr.com/avalanche",
  250: "https://rpc.ankr.com/fantom",
  10: "https://rpc.ankr.com/optimism",
  42161: "https://rpc.ankr.com/arbitrum",
  634: "https://rpc.avocado.instadapp.io",
  100: "https://rpc.ankr.com/gnosis",
  56: "https://rpc.ankr.com/bsc",
};

const nativeTokenIdChainIdsMapping: { [coinId: string]: number[] } = {
  ethereum: [1, 10, 42161],
  "matic-network": [137],
  "avalanche-2": [43114],
  fantom: [250],
  xdai: [100],
  binancecoin: [56],
};

const rpcInstances: Record<string, StaticJsonRpcRetryProvider> = {};

const getRpcProvider = (chainId: number | string) => {
  if (!rpcInstances[chainId]) {
    rpcInstances[chainId] = new StaticJsonRpcRetryProvider(
      RPC_URLS[Number(chainId)]
    );
  }

  return rpcInstances[chainId];
};

const platforms = [
  { platformId: "ethereum", chainId: 1 },
  { platformId: "polygon-pos", chainId: 137 },
  { platformId: "avalanche", chainId: 43114 },
  { platformId: "arbitrum-one", chainId: 42161 },
  { platformId: "optimistic-ethereum", chainId: 10 },
  // { platformId: 'fantom', chainId: 250, },
  { platformId: "binance-smart-chain", chainId: 56 },
  { platformId: "xdai", chainId: 100 },
];
const platformIdChainIdMap = platforms.reduce((acc, curr) => {
  acc[curr.platformId] = curr.chainId;
  return acc;
}, {} as Record<string, number>);

const coinIds = [
  ...new Set([
    // native
    "ethereum",
    "matic-network",
    "avalanche-2",
    "fantom",
    "xdai",
    "binancecoin",

    "usd-coin",
    "dai",
    "tether",
    "weth",
    "wrapped-bitcoin",
    "maker",
    "compound-governance-token",
    "staked-ether",
    "aave",
    "liquity",
    "euro-coin",
    "chainlink",
    "decentraland",
    "wrapped-steth",
    "ethereum-name-service",
    "rai",
    "liquity-usd",
    "0x",
    "true-usd",
    "stabilize-usd",
    "sbtc",
    "republic-protocol",
    "renbtc",
    "binance-usd",
    "uniswap",
    "yearn-finance",
    "loopring",
    "balancer",
    "1inch",
    "sushi",
    "curve-dao-token",
    "frax",
    "fei-usd",
    "notional-finance",
    "lido-dao",
    "shiba-inu",
    "ribbon-finance",
    "perpetual-protocol",
    "convex-finance",
    "ageur",
    "euler",
    "coinbase-wrapped-staked-eth",
    "instadapp",
    "instadapp-eth",
    "instadapp-wbtc",
    "instadapp-usdc",
    "instadapp-dai",
    "magic",
    "illuvium",
    "cronos",
    "okb",
    "apecoin",
    "quant",
    "bitdao",
    "chiliz",
    "axie",
    "huobi-token",
    "kucoin-shares",
    "usdd",
    "gemini-dollar",
    "synthetix-network",
    "pax-gold",
    "nexo",
    "immutablex",
    "optimism",
    "enjin",
    "kava",
    "rocket",
    "basic-attention",
    "holo",
    "gala",
    "woo",
    "gnosis",
    "singularitynet",
    "chain",
    "iotex",
    "bone",
    "swissborg",
    "ankr",
    "fetch-ai",
    "jasmycoin",
    "golem",
    "dydx",
    "terrausd",
    "amp",
    "ssv",
    "mask-network",
    "omg-network",
    "threshold-network",
    "dogelon-mars",
    "toncoin",
    "leo-token",
    "frax-share",
    "compound-usd-coin",
    "compound-dai",
    "tokenize-xchange",
    "btse-token",
    "tether-gold",
    "compound-ether",
    "xdc-network",
    "holo",
    "audius",
    "nexus-mutual",
    "bitget-token",
    "olympus",
    "render-token",
    "celsius-network-token",
    "ecomi",
    "gmx",
  ]),
];

export type Token = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

const getTokens = async () => {
  let tokens: Token[] = [];

  const coins: any[] = await $fetch(
    `${COINGECKO_BASE_API}/coins/list?include_platform=true`,
    {
      params: {
        include_platform: true,
        x_cg_pro_api_key: process.env.COINGECKO_KEY,
      },
    }
  ).then((cs) => cs.filter((c: any) => coinIds.includes(c.id)));

  for (const coin of coins) {
    let logoURI = "";

    if (existsSync(resolve(__dirname, "../public/tokens/", `${coin.id}.svg`))) {
      logoURI = `https://avocado.instadapp.io/tokens/${coin.id}.svg`;
    } else {
      const coinData: any = await $fetch(
        `${COINGECKO_BASE_API}/coins/${coin.id}?tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
        {
          params: {
            include_platform: true,
            x_cg_pro_api_key: process.env.COINGECKO_KEY,
          },
        }
      ).catch(() => null);
      logoURI = coinData && coinData.image ? coinData.image.large : "";
    }

    const nativeChainIds = nativeTokenIdChainIdsMapping[coin.id];

    if (nativeChainIds) {
      for (const chainId of nativeChainIds) {
        tokens.push({
          chainId,
          address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          name: coin.name,
          symbol: coin.symbol,
          decimals: 18,
          logoURI,
        });
      }
    }

    for (const platformId in coin.platforms) {
      try {
        let chainId = platformIdChainIdMap[platformId];

        if (!chainId) {
          continue;
        }

        if (nativeChainIds && nativeChainIds.includes(chainId)) {
          continue;
        }

        if (coin.platforms[platformId]) {
          let contract = new ethers.Contract(
            coin.platforms[platformId],
            ["function decimals() view returns (uint8)"],
            getRpcProvider(chainId)
          );

          tokens.push({
            chainId,
            address: coin.platforms[platformId],
            name: coin.name,
            symbol: coin.symbol,
            decimals: await contract.decimals(),
            logoURI,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  return tokens;
};

const gen = async () => {
  const tokens = await getTokens();

  console.log(`generated (${tokens.length}) tokens`);

  await writeJson(
    resolve(__dirname, "../public/tokenlist.json"),
    {
      name: "Avocado",
      logoURI: "https://avocado.instadapp.io/logo.svg",
      keywords: ["avocado", "defi"],
      timestamp: new Date().toISOString(),
      tokens,
      version: {
        major: 1,
        minor: 0,
        patch: 0,
      },
    },
    {
      spaces: "\t",
    }
  );
};

gen();
