import { BigNumber } from "bignumber.js"

const networks = [
    { chain: "arb", chain_id: 42161 },
    { chain: "bsc", chain_id: 56 },
    { chain: "matic", chain_id: 137 },
    { chain: "eth", chain_id: 1 },
    { chain: "xdai", chain_id: 100 },
    { chain: "avax", chain_id: 43114 },
    { chain: "op", chain_id: 10 },
]

const { debankAccessKey } = useRuntimeConfig()

export default defineEventHandler(async (event) => {
    const { address } = getQuery(event)
    let balances: any[] = await $fetch("https://pro-openapi.debank.com/v1/user/all_token_list", {
        params: {
            id: address,
            is_all: false,
        },
        headers: {
            AccessKey: debankAccessKey
        }
    });

    balances = balances.map((token: any) => {
        const price = token.price || 0;

        return {
            name: token.name,
            address: token.id.startsWith('0x') ? token.id : "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            decimals: token.decimals,
            symbol: token.symbol,
            chainId: networks.find(n => n.chain === token.chain)?.chain_id || null,
            logoURI: token.logo_url,
            price: new BigNumber(price).toFixed(0),
            balanceRaw: new BigNumber(token.raw_amount).toFixed(0),
            balance: new BigNumber(token.raw_amount).div(10 ** token.decimals).toFixed(),
            balanceInUSD: new BigNumber(token.raw_amount).div(10 ** token.decimals).times(price).toFixed(),
        }
    })

    balances = balances.filter(b => b.chainId !== null)

    return balances
        .filter(b => b.price !== '0')
        .sort((a, b) => new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber());
})