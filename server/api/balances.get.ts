import { BigNumber } from "bignumber.js"

interface IBalance {
    name: string
    address: string
    decimals: number
    symbol: string
    chainId: string
    logoURI: string
    price: number | null
    balanceRaw: string
    balance: string
    balanceInUSD: string
}

const networks = [
    { chain: "arb", chain_id: String(42161) },
    { chain: "bsc", chain_id: String(56) },
    { chain: "matic", chain_id: String(137) },
    { chain: "eth", chain_id: String(1) },
    { chain: "xdai", chain_id: String(100) },
    { chain: "avax", chain_id: String(43114) },
    { chain: "op", chain_id: String(10) },
]

const { debankAccessKey } = useRuntimeConfig()

export default defineEventHandler<IBalance[]>(async (event) => {
    const { address } = getQuery(event)
    let balances : any[]= await $fetch("https://pro-openapi.debank.com/v1/user/all_token_list", {
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