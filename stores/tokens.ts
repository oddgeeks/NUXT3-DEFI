import { acceptHMRUpdate, defineStore } from "pinia";

export interface IToken {
    name: string
    address: string
    decimals: number
    symbol: string
    chainId: string
    price: number
    verified: boolean
    coingeckoId?: string
    sparklinePrice7d: number[]
}

export const useTokens = defineStore("tokens", () => {
    console.log("defineStore::tokens");

    const tokens = shallowRef<IToken[]>([]);
    const verifiedTokens = computed<IToken[]>(() => tokens.value.filter(t => t.verified));

    const fetchTokens = async () => {
        try {
            tokens.value = await $fetch("https://prices.instadapp.io/tokens").then((ts) => (ts as any[]).filter(t => t.address !== "0x0000000000000000000000000000000000001010"));
        } catch (error) {

        }
    };

    onMounted(fetchTokens)

    useIntervalFn(fetchTokens, 10000, {
        immediate: true,
    });

    return {
        tokens,
        verifiedTokens,
        fetchTokens,
    }
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useTokens, import.meta.hot));
}