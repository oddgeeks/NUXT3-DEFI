import { $fetch } from "ohmyfetch"
import { writeJson } from "fs-extra"
import { resolve } from "path"
import { ethers } from 'ethers';
import dotenv from "dotenv"
dotenv.config()

const COINGECKO_BASE_API = process.env.COINGECKO_KEY ? 'https://pro-api.coingecko.com/api/v3' : 'https://api.coingecko.com/api/v3'

const RPC_URLS: { [chainId: number]: string } = {
    1: 'https://rpc.ankr.com/eth',
    137: 'https://rpc.ankr.com/polygon',
    43114: 'https://rpc.ankr.com/avalanche',
    250: 'https://rpc.ankr.com/fantom',
    10: 'https://rpc.ankr.com/optimism',
    42161: 'https://rpc.ankr.com/arbitrum',
    75: 'https://rpc.avocado.instad.app',
    100: 'https://rpc.ankr.com/gnosis',
    56: 'https://rpc.ankr.com/bsc',
};

const rpcInstances: Record<string, ethers.providers.JsonRpcProvider> = {}

const getRpcProvider = (chainId: number | string) => {
    if (!rpcInstances[chainId]) {
        rpcInstances[chainId] = new ethers.providers.JsonRpcProvider(RPC_URLS[Number(chainId)])
    }

    return rpcInstances[chainId]
}

const platforms = [
    { platformId: 'ethereum', chainId: 1, },
    { platformId: 'polygon-pos', chainId: 137, },
    { platformId: 'avalanche', chainId: 43114, },
    { platformId: 'arbitrum-one', chainId: 42161, },
    { platformId: 'optimistic-ethereum', chainId: 10, },
    // { platformId: 'fantom', chainId: 250, },
    { platformId: 'binance-smart-chain', chainId: 56, },
    { platformId: 'xdai', chainId: 100 },
]
const platformIdChainIdMap = platforms.reduce((acc, curr) => {
    acc[curr.platformId] = curr.chainId
    return acc
}, {} as Record<string, number>)

const coinIds = [
    "usd-coin",
    "ethereum",
    "dai",
    "tether",
    "weth",
    "wrapped-bitcoin",
    "maker",
    "compound",
    "lido-staked-ether",
    "aave",
    "polygon",
    "liquity",
    "euro-coin",
    "chainlink",
    "decentraland",
    "wrapped-steth",
    "ethereum-name-service",
    "rai",
    "liquity-usd",
    "0x",
    "true-usd",
    "susd",
    "sbtc",
    "ren",
    "ren-btc",
    "binance-usd",
    "uniswap",
    "yearn-finance",
    "loopring",
    "balancer",
    "1inch",
    "sushi",
    "curve-dao-token",
    "frax",
    "fei-usd",
    "notional-finance",
    "lido-dao",
    "shiba-inu",
    "ribbon-finance",
    "perpetual-protocol",
    "convex-finance",
    "ageur",
    "euler",
    "coinbase-wrapped-staked-eth",
    "instadapp",
    "instadapp-eth",
    "instadapp-wbtc",
    "instadapp-usdc",
    "instadapp-dai",
]

export type Token = {
    chainId: number
    address: string
    name: string
    symbol: string
    decimals: number
    logoURI: string
}


const getTokens = async () => {
    let tokens: Token[] = []

    const coins: any[] = await $fetch(`${COINGECKO_BASE_API}/coins/list?include_platform=true`, {
        params: { include_platform: true, x_cg_pro_api_key: process.env.COINGECKO_KEY }
    }).then((cs) => cs.filter(c => coinIds.includes(c.id)));

    for (const coin of coins) {
        const coinData: any = await $fetch(`${COINGECKO_BASE_API}/coins/${coin.id}?tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`, {
            params: { include_platform: true, x_cg_pro_api_key: process.env.COINGECKO_KEY }
        }).catch(() => null);

        for (const platformId in coin.platforms) {
            try {
                let chainId = platformIdChainIdMap[platformId];

                if (!chainId) {
                    continue
                }

                let contract = new ethers.Contract(
                    coin.platforms[platformId],
                    [
                        "function decimals() view returns (uint8)",
                    ],
                    getRpcProvider(chainId)
                );

                tokens.push({
                    chainId,
                    address: coin.platforms[platformId],
                    name: coin.name,
                    symbol: coin.symbol,
                    decimals: await contract.decimals(),
                    logoURI: coinData && coinData.image ? coinData.image.large : ''
                })
            } catch (error) {
                console.log(error)
            }
        }
    }


    return tokens
}


const gen = async () => {
    await writeJson(resolve(__dirname, '../public/tokenlist.json'), {
        "name": "Avocado",
        "logoURI": "https://instadapp.io/images/logo.svg",
        "keywords": [
            "avocado",
            "defi"
        ],
        "timestamp": new Date().toISOString(),
        "tokens": await getTokens(),
        "version": {
            "major": 1,
            "minor": 0,
            "patch": 0
        }
    }, {
        spaces: '\t'
    })
}

gen();