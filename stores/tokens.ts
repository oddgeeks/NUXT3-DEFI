import { acceptHMRUpdate, defineStore } from 'pinia'

import { collect } from 'collect.js'

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
  isCustomToken?: boolean
}

export const useTokens = defineStore('tokens', () => {
  const tokens = ref<IToken[]>([])
  const customTokens = useStorageAsync<IToken[]>('custom-tokens', [])

  const fetchTokens = async () => {
    try {
      const data: any = await $fetch(
        'https://cdn.instadapp.io/avocado/tokenlist.json',
      )

      const supportedTokens = data.tokens.filter((i: any) => availableNetworks.some(n => String(n.chainId) === String(i.chainId)))

      tokens.value = await fetchTokenPrices([
        ...supportedTokens.map((t: any) => ({
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
      ])
    }
    catch (error) {}
  }

  async function fetchTokenPrices(list: IToken[]) {
    const _tokenList = cloneDeep(toRaw(list))

    const chainTokens: Record<string, IToken[]> = collect(_tokenList)
      .mapToGroups((item: any) => [item.chainId, item])
      .all() as any

    await Promise.allSettled(
      Object.keys(chainTokens).map(async (cid) => {
        const ts = chainTokens[cid]

        const addresses = ts.map(t => t.address)

        const prices: ITokenPrice[] = await fetchTokenByAddress(addresses, cid, true)

        for (const tokenPrice of prices) {
          const token = _tokenList.find(
            t =>
              t.chainId == String(cid)
              && t.address.toLowerCase() === tokenPrice.address.toLowerCase(),
          )

          if (token) {
            const sparkline = tokenPrice?.sparkline_price_7d || []

            const price = toBN(tokenPrice?.price || '0').eq('0') && sparkline.length > 0
              ? sparkline[sparkline.length - 1]
              : tokenPrice?.price

            token.price = toBN(price || '0').toNumber()
            token.sparklinePrice7d = sparkline
          }
          else {
            console.log(
              tokenPrice.chain_id === String(cid),
              tokenPrice.chain_id,
              cid,
              tokenPrice.address,
              tokenPrice.address,
            )
          }
        }
      }),
    )

    return _tokenList
  }

  const fetchTokenByAddress = async (addresses: string[], chainId: string, sparkline = false) => {
    return http(`${blockQueryURL}/${chainId}/tokens`, {
      params: {
        'sparkline': sparkline,
        'addresses[]': addresses,
      },
    }) as Promise<ITokenPrice[]>
  }

  const getTokenByAddress = (address: string, chainId: string | number) => {
    return tokens.value.find(
      t =>
        String(t.chainId) === String(chainId)
        && t.address.toLowerCase() === address.toLowerCase(),
    )
  }

  onMounted(async () => {
    await fetchTokens()

    // preload at custom tokens
    http('/api/tokens')
  })

  const handleTokenPrices = async () => {
    tokens.value = await fetchTokenPrices(tokens.value)
  }

  const handleAddToken = async (token: IToken) => {
    token.isCustomToken = true
    customTokens.value.push(token)
    await fetchTokens()
  }

  const handleDeleteToken = (token: IToken) => {
    const index = customTokens.value.findIndex(
      t =>
        t.address.toLowerCase() === token.address.toLowerCase()
        && t.chainId == token.chainId,
    )

    if (index > -1) {
      customTokens.value.splice(index, 1)
      fetchTokens()
    }
  }

  useIntervalFn(handleTokenPrices, 10000)

  return {
    tokens,
    fetchTokens,
    getTokenByAddress,
    customTokens,
    handleAddToken,
    handleDeleteToken,
    fetchTokenByAddress,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useTokens, import.meta.hot))
