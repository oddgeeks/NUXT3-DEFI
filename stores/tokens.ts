import { acceptHMRUpdate, defineStore } from "pinia";

import { collect } from "collect.js";

export interface IToken {
  name: string;
  address: string;
  decimals: number;
  symbol: string;
  chainId: string;
  logoURI: string;
  price: number | null;
  coingeckoId: string | null;
  sparklinePrice7d: number[];
  isCustomToken?: boolean;
}

export const useTokens = defineStore("tokens", () => {
  const tokens = ref<IToken[]>([]);
  const customTokens = useStorageAsync<IToken[]>("custom-tokens", []);
  const { account } = useWeb3();

  const fetchTokens = async () => {
    try {
      const data: any = await $fetch("/tokenlist.json");

      tokens.value = await fetchTokenPrices([
        ...data.tokens.map((t: any) => ({
          name: t.name,
          address: t.address,
          decimals: t.decimals,
          symbol: t.symbol,
          logoURI: t.logoURI,
          chainId: String(t.chainId),
          price: null,
          coingeckoId: null,
          sparklinePrice7d: [],
        })),
        ...customTokens.value,
      ]);
    } catch (error) {}
  };

  const fetchTokenPrices = async (list: IToken[]) => {
    const _tokenList = cloneDeep(toRaw(list));

    const chainTokens: Record<string, IToken[]> = collect(_tokenList)
      .mapToGroups((item: any) => [item.chainId, item])
      .all() as any;

    await Promise.allSettled(
      Object.keys(chainTokens).map(async (cid) => {
        const ts = chainTokens[cid];

        const prices: IToken[] = await $fetch(
          `https://prices.instadapp.io/${cid}/tokens`,
          {
            params: {
              addresses: ts.map((t) => t.address),
            },
          }
        );

        for (const tokenPrice of prices) {
          const token = _tokenList.find(
            (t) =>
              t.chainId === String(cid) &&
              t.address.toLowerCase() === tokenPrice.address.toLowerCase()
          );

          if (token) {
            token.price = tokenPrice.price;
            token.sparklinePrice7d = tokenPrice.sparklinePrice7d || [];
          } else {
            console.log(
              tokenPrice.chainId === String(cid) &&
                tokenPrice.address.toLowerCase() ===
                  tokenPrice.address.toLowerCase(),
              tokenPrice.chainId,
              cid,
              tokenPrice.address,
              tokenPrice.address
            );
          }
        }
      })
    );

    return _tokenList;
  };

  const getTokenByAddress = (address: string, chainId: string | number) => {
    return tokens.value.find(
      (t) =>
        String(t.chainId) === String(chainId) &&
        t.address.toLowerCase() === address.toLowerCase()
    );
  };

  onMounted(async () => {
    await fetchTokens();

    // preload at custom tokens
    await $fetch("/api/tokens");
  });

  const handleTokenPrices = async () => {
    tokens.value = await fetchTokenPrices(tokens.value);
  };

  const handleAddToken = (token: IToken) => {
    token.isCustomToken = true;
    customTokens.value.push(token);
    fetchTokens();

    const url = `<${getExplorerUrl(
      token.chainId,
      `/token/${token.address}`
    )}|${shortenHash(token.address, 12)}>`;

    // logActionToSlack({
    //   action: "add-token",
    //   message: `${token.name} :${chainIdToName(token.chainId)}: ${url}`,
    //   account: account.value,
    // });
  };

  useIntervalFn(handleTokenPrices, 10000);

  return {
    tokens,
    fetchTokens,
    getTokenByAddress,
    customTokens,
    handleAddToken,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTokens, import.meta.hot));
}
