import { BigNumber } from "bignumber.js";
import { H3Event } from "h3";
import { AnkrProvider } from "@ankr.com/ankr.js";
import {
  TokenBalanceResolver,
  TokenBalanceResolver__factory,
} from "~~/contracts";
import collect from "collect.js";
import { IToken } from "~~/stores/tokens";
import { slackIt } from "~~/server/utils";

let tokens: any[] = [];
let lastUpdateTokens: number = 0;

//
const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  acc[curr.chainId] = TokenBalanceResolver__factory.connect(
    "0x3fb128aa5ac254c8539996b11c587e521ae0d3ab",
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
        balanceResolverContracts[chainId].callStatic.getBalances(
          address,
          addresses
        ),
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

        let balance = toBN(balances[index].balance).div(
          10 ** tokenPrice.decimals
        );

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

const ignoredReasons = ["Body is unusable"]; // Add more strings to ignore slack logs of more reasons
const shouldIgnoreReason = (error: PromiseRejectedResult): boolean => {
  const message = String(error?.reason);

  return ignoredReasons.some((ir) => message.includes(ir));
};

// // Added slack logs to understand how is exactly balance fetching happening on production
// const slackIt = async (type: string, message: string) => {
//   $fetch("/api/slack", {
//     method: "POST",
//     body: {
//       type: type,
//       message: message,
//     },
//   });
// }

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
          // NOTE: This is a temporary fix to avoid spamming slack logs - reenable whenever needed in future
          // As of now this API is not used to load main balances on frontend, its being used for showing Onboard banner in this repo and on onboard repo
          // slackIt("error", `[server/api/balances.get.ts] #001 Error fetching NORMAL balances - ${network?.name} - ${query.address} - ${item?.reason}`);
        }

        if (network && network?.ankrName) {
          const val = await getFromAnkr(
            String(query.address),
            network.ankrName
          );
          balances.push(...val);
        } else {
          // slackIt("error", `[server/api/balances.get.ts] #003 Error fetching ANKR balances (fallback) - ${network?.name} - ${query.address} - ${item?.reason}`);
          slackIt("banner", {
            title: "[server/api/balances.get.ts]",
            address: query.address as string,
            chainId: network?.chainId as number,
            message: `Error fetching ANKR balances (fallback) - ${item?.reason}`,
          });
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
      slackIt("banner", {
        title: "[server/api/balances.get.ts]",
        address: query.address as string,
        chainId: 0,
        message: `Everything failed, trying debank now`,
      });
      return await getFromDebank(String(query.address));
    }
  }
});
