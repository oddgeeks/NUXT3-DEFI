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

const ankrNetworks: Record<string, string> = {
    "arbitrum": String(42161),
    "bsc": String(56),
    "polygon": String(137),
    "eth": String(1),
    "gnosis": String(100),
    "avalanche": String(43114),
    "optimism": String(10),
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

const { debankAccessKey, ankrApiKey } = useRuntimeConfig()

import { AnkrProvider } from '@ankr.com/ankr.js';

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey)

const getFromDebank = async (address: string) => {

    let balances: any[] = await $fetch("https://pro-openapi.debank.com/v1/user/all_token_list", {
        retry: 3,
        params: {
            id: address,
            is_all: true,
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
            price: new BigNumber(price).toFixed(),
            balanceRaw: new BigNumber(token.raw_amount).toFixed(0),
            balance: new BigNumber(token.raw_amount).div(10 ** token.decimals).toFixed(),
            balanceInUSD: new BigNumber(token.raw_amount).div(10 ** token.decimals).times(price).toFixed(),
        }
    })

    balances = balances.filter(b => b.chainId !== null)

    return balances.sort((a, b) => new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber());
}

const getFromAnkr = async (address: string): Promise<IBalance[]> => {
    const ankrBalances = await ankrProvider.getAccountBalance({
        blockchain: [],
        walletAddress: address,
    });

    let balances = ankrBalances.assets.map((asset) => ({
        name: asset.tokenName,
        address: asset.tokenType === "NATIVE" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : asset.contractAddress!,
        decimals: asset.tokenDecimals,
        symbol: asset.tokenSymbol,
        chainId: ankrNetworks[asset.blockchain as any] || null,
        logoURI: asset.thumbnail,
        price: asset.tokenPrice,
        balanceRaw: asset.balanceRawInteger,
        balance: asset.balance,
        balanceInUSD: asset.balanceUsd,
    }));

    balances = balances.filter(b => b.chainId !== null)

    balances = balances.sort((a, b) => new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber());

    return balances as any;
}

export default defineEventHandler<IBalance[]>(async (event) => {
    const { address } = getQuery(event)

    try {
        return await getFromDebank(String(address))
    } catch (error) {
        return await getFromAnkr(String(address))
    }
})