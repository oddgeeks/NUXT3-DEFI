import { BigNumber } from "bignumber.js";
import { H3Event } from "h3";
import { AnkrProvider } from "@ankr.com/ankr.js";
import { TokenBalanceResolver, TokenBalanceResolver__factory } from "~~/contracts";
import collect from "collect.js";
import { IToken } from "~~/stores/tokens";

let tokens: any[] = [];
let lastUpdateTokens: number = 0;

//
const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  acc[curr.chainId] = TokenBalanceResolver__factory.connect(
    "0xB61D697fe78C9DE25285DbE69b2d7eb6DF899A88",
    getServerRpcProvider(curr.chainId)
  );
  return acc;
}, {} as Record<string, TokenBalanceResolver>);

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

const getFromAnkr = async (
  address: string,
  blockchain?: any
): Promise<IBalance[]> => {
  const ankrBalances = await ankrProvider.getAccountBalance({
    blockchain: blockchain || [],
    walletAddress: address,
  });

  let balances = ankrBalances.assets.map((asset) => {
    const network = networks.find((n) => n.ankrName === asset.blockchain)!;

    return {
      name: asset.tokenName,
      address:
        asset.tokenType === "NATIVE"
          ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          : asset.contractAddress!,
      decimals: asset.tokenDecimals,
      symbol: asset.tokenSymbol,
      chainId: String(network.chainId) || null,
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

      const [{ balances }, prices] = await Promise.all([
        balanceResolverContracts[chainId].callStatic.getBalances(address, addresses),
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
        if (!balances[index].success) continue;

        let balance = toBN(balances[index].balance).div(10 ** tokenPrice.decimals);

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

const ignoredReasons = ['TypeError: Body is unusable']; // Add more strings to ignore slack logs of more reasons
const shouldIgnoreReason = (reason: string): boolean => {
  return ignoredReasons.includes(reason);
};

// Added slack logs to understand how is exactly balance fetching happening on production
const slackIt = async (type: string, message: string) => {
  $fetch("/api/slack", {
    method: "POST",
    body: {
      type: type,
      message: message,
    },
  });
}

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
    const promises = await Promise.allSettled(
      availableNetworks.map((network) =>
        getChainBalances(
          String(network.chainId),
          String(query.address),
          getQueryCustomTokens(event, String(network.chainId))
        )
      )
    );

    const balances: IBalance[] = [];

    for (const i in promises) {
      const item = promises[i];

      if (item.status === "fulfilled") {
        balances.push(...item.value);
      } else {
        const network = availableNetworks[i];

        if (!shouldIgnoreReason(item?.reason)) {
          slackIt("error", `[server/api/balances.get.ts] #001 Error fetching NORMAL balances - ${item?.reason} - ${network?.name} - ${query.address}`);
        }

        if (network && network?.ankrName) {
          slackIt("error", `[server/api/balances.get.ts] #002 fetching ANKR balances initiated (fallback) - ${item?.reason} - ${network?.name} - ${query.address}`);
          const val = await getFromAnkr(
            String(query.address),
            network.ankrName
          );
          balances.push(...val);
        } else {
          slackIt("error", `[server/api/balances.get.ts] #003 Error fetching ANKR balances (fallback) - ${item?.reason} - ${network?.name} - ${query.address}`);
          throw new Error("Fallback failed");
        }
      }
    }

    return balances;
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
      slackIt("error", `[server/api/balances.get.ts] #004 Everything failed, trying debank now - ${query.address}`);
      return await getFromDebank(String(query.address));
    }
  }
});
