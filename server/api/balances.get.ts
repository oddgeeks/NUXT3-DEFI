import { BigNumber } from "bignumber.js";
import tokenlist from "~/public/tokenlist.json";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { BalanceResolver, BalanceResolver__factory } from "~~/contracts";
import collect from "collect.js";
import { IToken } from "~~/stores/tokens";
import { toBN } from "~~/utils";
import { getRpcProvider } from "~~/utils/network";

const tokens = tokenlist.tokens;

const balanceResolverAddresses: Record<string, string> = {
  "137": "0x58632D23120b20650262b8A629a14e4F4043E0D9",
  "42161": "0xca5f37e6D8bB24c5A7958d5eccE7Bd9Aacc944f2",
  "43114": "0x63009f31D054E0ac9F321Cf0D642375236A4Bf1E",
  "10": "0xca5f37e6D8bB24c5A7958d5eccE7Bd9Aacc944f2",
  "1": "0x5b7D61b389D12e1f5873d0cCEe7E675915AB5F43",
  "56": "0xb808cff38706e267067b0af427726aa099f69f89",
  "100": "0xfaa244e276b1597f663975ed007ee4ff70d27849",
  "1101": "0x48D1Fa5Ee6691a1E0B45d2B515650997BEA27a01",
};

const balanceResolverContracts = Object.keys(balanceResolverAddresses).reduce(
  (acc, curr) => {
    acc[curr] = BalanceResolver__factory.connect(
      balanceResolverAddresses[curr],
      getRpcProvider(curr)
    );
    return acc;
  },
  {} as Record<string, BalanceResolver>
);

interface IBalance extends Partial<IToken> {
  balanceRaw: string;
  balance: string;
  balanceInUSD: string;
}

const ankrNetworks: Record<string, string> = {
  arbitrum: String(42161),
  bsc: String(56),
  polygon: String(137),
  eth: String(1),
  gnosis: String(100),
  avalanche: String(43114),
  optimism: String(10),
};

const networks = [
  { chain: "arb", chain_id: String(42161) },
  { chain: "bsc", chain_id: String(56) },
  { chain: "matic", chain_id: String(137) },
  { chain: "eth", chain_id: String(1) },
  { chain: "xdai", chain_id: String(100) },
  { chain: "avax", chain_id: String(43114) },
  { chain: "op", chain_id: String(10) },
];

const { debankAccessKey, ankrApiKey } = useRuntimeConfig();

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey);

const getFromDebank = async (address: string) => {
  let balances: any[] = await $fetch(
    "https://pro-openapi.debank.com/v1/user/all_token_list",
    {
      retry: 3,
      params: {
        id: address,
        is_all: true,
      },
      headers: {
        AccessKey: debankAccessKey,
      },
    }
  );

  balances = balances.map((token: any) => {
    const price = token.price || 0;

    return {
      name: token.name,
      address: token.id.startsWith("0x")
        ? token.id
        : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: token.decimals,
      symbol: token.symbol,
      chainId: networks.find((n) => n.chain === token.chain)?.chain_id || null,
      logoURI: token.logo_url,
      price: new BigNumber(price).toFixed(),
      balanceRaw: new BigNumber(token.raw_amount).toFixed(0),
      balance: new BigNumber(token.raw_amount)
        .div(10 ** token.decimals)
        .toFixed(),
      balanceInUSD: new BigNumber(token.raw_amount)
        .div(10 ** token.decimals)
        .times(price)
        .toFixed(),
    };
  });

  balances = balances.filter((b) => b.chainId !== null);

  return balances.sort((a, b) =>
    new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber()
  );
};

const getFromAnkr = async (address: string): Promise<IBalance[]> => {
  const ankrBalances = await ankrProvider.getAccountBalance({
    blockchain: [],
    walletAddress: address,
  });

  let balances = ankrBalances.assets.map((asset) => ({
    name: asset.tokenName,
    address:
      asset.tokenType === "NATIVE"
        ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
        : asset.contractAddress!,
    decimals: asset.tokenDecimals,
    symbol: asset.tokenSymbol,
    chainId: ankrNetworks[asset.blockchain as any] || null,
    logoURI: asset.thumbnail,
    price: asset.tokenPrice,
    balanceRaw: asset.balanceRawInteger,
    balance: asset.balance,
    balanceInUSD: asset.balanceUsd,
  }));

  balances = balances.filter((b) => b.chainId !== null);

  balances = balances.sort((a, b) =>
    new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber()
  );

  return balances as any;
};

const getChainBalances = async (
  chainId: string,
  address: string,
  customTokenAddresses: string[] = []
) => {
  let newBalances: IBalance[] = [];

  const chainTokenAddresses = collect([
    ...tokens
      .filter((t) => String(t.chainId) === chainId)
      .map((t) => t.address),
    ...customTokenAddresses,
  ])
    .chunk(chainId === "42161" ? 5 : 20)
    .all();

  await Promise.all(
    chainTokenAddresses.map(async (chunk: any[]) => {
      const addresses = (chunk as any).all();

      const [balances, prices] = await Promise.all([
        balanceResolverContracts[chainId].getBalances(address, addresses),
        $fetch<IToken[]>(`https://prices.instadapp.io/${chainId}/tokens`, {
          params: {
            includeSparklinePrice7d: false,
            addresses,
          },
        }),
      ]);

      for (let index = 0; index < balances.length; index++) {
        let tokenAddress = addresses[index];
        let tokenPrice = prices.find(
          (p) => p.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        if (!tokenPrice) continue;

        let balance = toBN(balances[index]).div(10 ** tokenPrice.decimals);

        if (balance.gt(0)) {
          newBalances.push({
            name: tokenPrice.name,
            address: tokenPrice.address,
            decimals: tokenPrice.decimals,
            symbol: tokenPrice.symbol,
            logoURI: tokenPrice.logoURI,
            chainId: String(chainId),
            price: String(tokenPrice?.price || 0) as any,
            balanceRaw: balances[index].toString(),
            balance: balance.toFixed(6, 1),
            balanceInUSD: balance.times(tokenPrice?.price || 0).toFixed(2),
          });
        }
      }
    })
  );

  return newBalances;
};

export default defineEventHandler<IBalance[]>(async (event) => {
  let query = getQuery(event);

  const gnosisTokens = query["customTokens[100]"]
    ? Array.isArray(query["customTokens[100]"])
      ? query["customTokens[100]"]
      : [query["customTokens[100]"]]
    : undefined;
  try {
    return await Promise.all([
      getFromAnkr(String(query.address)),
      getChainBalances("100", String(query.address), gnosisTokens),
    ]).then((r) => r.flat());
  } catch (error) {
    return await getFromDebank(String(query.address));
  }
});
