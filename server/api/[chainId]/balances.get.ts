import { BigNumber } from 'bignumber.js'
import type { H3Event } from 'h3'
import { AnkrProvider } from '@ankr.com/ankr.js'
import collect from 'collect.js'
import { ethers } from 'ethers'
import type { TokenBalanceResolver } from '~~/contracts'
import {
  TokenBalanceResolver__factory,
} from '~~/contracts'
import type { IToken } from '~~/stores/tokens'
import { slackIt } from '~~/server/utils'
import { blockQueryURL } from '~~/utils/avocado'

let tokens: any[] = []
let lastUpdateTokens = 0

//
const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  acc[curr.chainId] = TokenBalanceResolver__factory.connect(
    '0x3fb128aa5ac254c8539996b11c587e521ae0d3ab',
    getServerRpcProvider(curr.chainId),
  )
  return acc
}, {} as Record<string, TokenBalanceResolver>)

interface IBalance extends Partial<IToken> {
  balanceRaw: string
  balance: string
  balanceInUSD: string
}

const { ankrApiKey } = useRuntimeConfig()

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey)

async function getFromAnkr(address: string, blockchain?: any): Promise<IBalance[]> {
  const ankrBalances = await ankrProvider.getAccountBalance({
    blockchain: blockchain || [],
    walletAddress: address,
  })

  let balances = ankrBalances.assets.map((asset) => {
    const network = networks.find(n => n.ankrName === asset.blockchain)!

    if (!network)
      return

    return {
      name: asset.tokenName,
      address:
        asset.tokenType === 'NATIVE'
          ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
          : asset.contractAddress!,
      decimals: asset.tokenDecimals,
      symbol: asset.tokenSymbol,
      chainId: String(network.chainId) || null,
      logoURI: asset.thumbnail,
      price: asset.tokenPrice,
      balanceRaw: asset.balanceRawInteger,
      balance: asset.balance,
      balanceInUSD: asset.balanceUsd,
    }
  })

  balances = balances.filter(Boolean)

  balances = balances.sort((a, b) =>
    new BigNumber(b.balanceInUSD).minus(a.balanceInUSD).toNumber(),
  )

  return balances as any
}

async function getChainBalances(chainId: string, address: string, customTokenAddresses: string[] = []) {
  const newBalances: IBalance[] = []

  const chainTokenAddresses = collect([
    ...tokens
      .filter(t => String(t.chainId) === chainId)
      .map(t => t.address),
    ...customTokenAddresses,
  ])
    .chunk(chainId === '42161' ? 5 : 20)
    .all()

  await Promise.all(
    chainTokenAddresses.map(async (chunk: any[]) => {
      const addresses = (chunk as any).all()

      const [{ balances }, prices] = await Promise.all([
        balanceResolverContracts[chainId].callStatic.getBalances(
          address,
          addresses,
        ),
        $fetch<ITokenPrice[]>(`${blockQueryURL}/${chainId}/tokens`, {
          retry: 3,
          params: {
            sparkline: false,
            addresses,
          },
        }),
      ])

      for (let index = 0; index < balances.length; index++) {
        const tokenAddress = addresses[index]
        const tokenPrice = prices.find(
          p => p.address.toLowerCase() === tokenAddress.toLowerCase(),
        )
        if (!tokenPrice)
          continue
        if (!balances[index].success)
          continue

        const balance = toBN(balances[index].balance).div(
          10 ** tokenPrice.decimals,
        )

        if (balance.gt(0)) {
          newBalances.push({
            name: tokenPrice.name,
            address: ethers.utils.getAddress(tokenPrice.address),
            decimals: tokenPrice.decimals,
            symbol: tokenPrice.symbol,
            logoURI: tokenPrice.logo_url,
            chainId: String(chainId),
            price: String(tokenPrice?.price || 0) as any,
            balanceRaw: balances[index].balance.toString(),
            balance: balance.toFixed(6, 1),
            balanceInUSD: balance.times(tokenPrice?.price || 0).toFixed(2),
          })
        }
      }
    }),
  )

  return newBalances
}

function getQueryCustomTokens(event: H3Event) {
  const query = getQuery(event)

  return query['customTokens[]']
    ? Array.isArray(query['customTokens[]'])
      ? (query['customTokens[]'] as string[])
      : [query['customTokens[]'] as string]
    : []
}

export default defineEventHandler<Promise<IBalance[]>>(async (event) => {
  const query = getQuery(event)
  const chainId = getRouterParam(event, 'chainId')
  const network = availableNetworks.find(n => String(n.chainId) == String(chainId))

  if (!network)
    return []

  if (!lastUpdateTokens || Date.now() - lastUpdateTokens > 10_000_000) {
    const data: any = await $fetch(
      'https://cdn.instadapp.io/avocado/tokenlist.json',
    )
    tokens = data.tokens
    lastUpdateTokens = Date.now()
  }

  try {
    return await getChainBalances(
      String(network.chainId),
      String(query.address),
      getQueryCustomTokens(event),
    )
  }
  catch (error) {
    if (!network?.ankrName)
      return []

    slackIt('banner', {
      title: '[server/api/[chainId]/balances.get.ts]',
      address: query.address as string,
      chainId: network.chainId,
      userAddress: query?.userAddress as string,
      message:
        '#001 Error fetching balances with direct RPC. Fallback to custom Ankr API.',
    })
    return getFromAnkr(String(query.address), network.ankrName)
  }
})
