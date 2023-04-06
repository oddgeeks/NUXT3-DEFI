import { BigNumber } from "bignumber.js";
import { H3Event } from "h3";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { BalanceResolver, BalanceResolver__factory } from "~~/contracts";
import collect from "collect.js";
import { IToken } from "~~/stores/tokens";
import { toBN } from "~~/utils";

let tokens = [];
let lastUpdateTokens: number = 0;

//
const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  console.log(curr.params.serverRpcUrl);
  if (!curr.params.balanceResolverAddress) return acc;
  acc[curr.chainId] = BalanceResolver__factory.connect(
    curr.params.balanceResolverAddress,
    getServerRpcProvider(curr.chainId)
  );
  return acc;
}, {} as Record<string, BalanceResolver>);

interface IBalance extends Partial<IToken> {
  balanceRaw: string;
  balance: string;
  balanceInUSD: string;
}

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
    const network = networks.find((n) => n.debankName === token.chain);

    return {
      name: token.name,
      address: token.id.startsWith("0x")
        ? token.id
        : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
      decimals: token.decimals,
      symbol: token.symbol,
      chainId: network.chainId || null,
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

  let balances = ankrBalances.assets.map((asset) => {
    const network = networks.find((n) => n.ankrName === asset.blockchain);

    return {
      name: asset.tokenName,
      address:
        asset.tokenType === "NATIVE"
          ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          : asset.contractAddress!,
      decimals: asset.tokenDecimals,
      symbol: asset.tokenSymbol,
      chainId: network.chainId || null,
      logoURI: asset.thumbnail,
      price: asset.tokenPrice,
      balanceRaw: asset.balanceRawInteger,
      balance: asset.balance,
      balanceInUSD: asset.balanceUsd,
    };
  });

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

const getQueryCustomTokens = (event: H3Event, chainId: string) => {
  const query = getQuery(event);

  return query[`customTokens[${chainId}]`]
    ? Array.isArray(query[`customTokens[${chainId}]`])
      ? (query[`customTokens[${chainId}]`] as string[])
      : [query[`customTokens[${chainId}]`] as string]
    : [];
};

export default defineEventHandler<IBalance[]>(async (event) => {
  let query = getQuery(event);

  if (!lastUpdateTokens || Date.now() - lastUpdateTokens > 10_000_000) {
    const data: any = await $fetch(
      "https://cdn.instadapp.io/avocado/tokenlist.json"
    );
    tokens = data.tokens;
    lastUpdateTokens = Date.now();
  }

  try {
    return await Promise.all(
      availableNetworks.map(async (network) => {
        return await getChainBalances(
          String(network.chainId),
          String(query.address),
          getQueryCustomTokens(event, String(network.chainId))
        );
      })
    ).then((r) => r.flat());
  } catch (error) {
    console.log(error);
    try {
      return await Promise.all([
        getFromAnkr(String(query.address)),
        getChainBalances(
          "100",
          String(query.address),
          getQueryCustomTokens(event, "100")
        ),
      ]).then((r) => r.flat());
    } catch (error) {
      return await getFromDebank(String(query.address));
    }
  }
});
