import { acceptHMRUpdate, defineStore } from "pinia";
import { collect } from "collect.js";

export interface IToken {
    name: string
    address: string
    decimals: number
    symbol: string
    chainId: string
    logoURI: string
    price: number | null
    coingeckoId: string | null
    sparklinePrice7d: number[]
}

export const useTokens = defineStore("tokens", () => {
    console.log("defineStore::tokens");

    const tokens = useLocalStorage<IToken[]>("tokens", []);

    const fetchTokens = async () => {
        try {
            const data: any = await $fetch("/tokenlist.json");
            tokens.value = await getTokenPrices(
                data.tokens.map((t: any) => ({
                    name: t.name,
                    address: t.address,
                    decimals: t.decimals,
                    symbol: t.symbol,
                    logoURI: t.logoURI,
                    chainId: String(t.chainId),
                    price: null,
                    coingeckoId: null,
                    sparklinePrice7d: []
                }))
            )
        } catch (error) {

        }
    };

    const getTokenPrices = async (_tokenList: IToken[]) => {
        const tokenList = [..._tokenList]
        const chainTokens: Record<string, IToken[]> = collect(tokenList).mapToGroups((item: any) => [item.chainId, item]).all() as any;

        await Promise.allSettled(Object.keys(chainTokens).map(async (cid) => {
            const ts = chainTokens[cid]

            const prices: IToken[] = await $fetch(`https://prices.instadapp.io/${cid}/tokens`, {
                params: {
                    addresses: ts.map(t => t.address)
                }
            })

            for (const tokenPrice of prices) {
                const token = tokenList.find((t) => t.chainId === String(cid) && t.address.toLowerCase() === tokenPrice.address.toLowerCase())

                if (token) {
                    token.price = tokenPrice.price
                    token.sparklinePrice7d = tokenPrice.sparklinePrice7d || []
                } else {
                    console.log(
                        tokenPrice.chainId === String(cid) && tokenPrice.address.toLowerCase() === tokenPrice.address.toLowerCase(),
                        tokenPrice.chainId,
                        cid,
                        tokenPrice.address,
                        tokenPrice.address,
                    )
                }
            }
        }))

        return tokenList
    };

    const getTokenByAddress = (address: string, chainId: string | number) => {
        return tokens.value.find((t) => String(t.chainId) === String(chainId) && t.address.toLowerCase() === address.toLowerCase())
    };

    onMounted(fetchTokens)

    const fetchTokenPrices = async () => {
        tokens.value = await getTokenPrices(tokens.value)
    }

    useIntervalFn(fetchTokenPrices, 10000);

    return {
        tokens,
        fetchTokens,
        getTokenByAddress,
    };
});



if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useTokens, import.meta.hot));
}