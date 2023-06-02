import axios from 'axios'
import AaveV2Url from '~/assets/images/protocols/aave-v2.svg?url'
import CompoundUrl from '~/assets/images/protocols/compound.svg?url'
import MakerUrl from '~/assets/images/protocols/makerdao.svg?url'
import LiteUrl from '~/assets/images/protocols/instadapp-lite.svg?url'

export function useDefi() {
  const { safeAddress } = useAvocadoSafe()

  const positions = ref<Positions[]>([])

  const makerdaoDefiURL = 'https://makerdao.com'
  const compoundDefiURL = 'https://compound.finance'
  const aaveDefiURL = 'https://aave.com'
  const liteDefiURL = 'https://instadapp.io'

  const defaultDefiApis: DefiApis[] = [
    {
      protocol: 'makerdao',
      apiPath: '/mainnet/makerdao/vaults',
      protocolId: 6,
      chainId: 1,
      logoURI: MakerUrl,
      label: 'MakerDAO',
      instadappURL: 'https://defi.instadapp.io/makerdao',
      defiURL: makerdaoDefiURL,
    },
    {
      protocol: 'compound',
      apiPath: '/mainnet/compound/position',
      protocolId: 3,
      chainId: 1,
      logoURI: CompoundUrl,
      label: 'Compound',
      instadappURL: 'https://defi.instadapp.io/compound',
      defiURL: compoundDefiURL,
    },
    {
      protocol: 'compound-v3',
      protocolId: 4,
      apiPath: '/mainnet/compound/v3/position',
      chainId: 1,
      logoURI: CompoundUrl,
      label: 'Compound V3',
      instadappURL: 'https://defi.instadapp.io/compound-v3',
      defiURL: compoundDefiURL,
    },

    {
      protocol: 'aave-v3',
      protocolId: 2,
      apiPath: '/mainnet/aave/v3/position',
      chainId: 1,
      logoURI: AaveV2Url,
      label: 'Aave V3',
      instadappURL: 'https://defi.instadapp.io/aave-v3',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v3',
      protocolId: 2,
      apiPath: '/polygon/aave/v3/position?stMaticApiCall=false',
      chainId: 137,
      logoURI: AaveV2Url,
      label: 'Aave V3',
      instadappURL: 'https://polygon.instadapp.io/aave-v3',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v3',
      protocolId: 2,
      apiPath: '/arbitrum/aave/v3/position',
      chainId: 42161,
      logoURI: AaveV2Url,
      label: 'Aave V3',
      instadappURL: 'https://arbitrum.instadapp.io/aave-v3',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v3',
      protocolId: 2,
      apiPath: '/avalanche/aave/v3/position',
      chainId: 43114,
      logoURI: AaveV2Url,
      label: 'Aave V3',
      instadappURL: 'https://avalanche.instadapp.io/aave-v3',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v3',
      protocolId: 2,
      apiPath: '/optimism/aave/v3/position',
      chainId: 10,
      logoURI: AaveV2Url,
      label: 'Aave V3',
      instadappURL: 'https://optimism.instadapp.io/aave-v3',
      defiURL: aaveDefiURL,
    },

    {
      protocol: 'aave-v2',
      protocolId: 1,
      apiPath: '/mainnet/aave/v2/position',
      chainId: 1,
      logoURI: AaveV2Url,
      label: 'Aave V2',
      instadappURL: 'https://defi.instadapp.io/aave-v2',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v2',
      protocolId: 1,
      apiPath: '/polygon/aave/v2/position',
      chainId: 137,
      logoURI: AaveV2Url,
      label: 'Aave V2',
      instadappURL: 'https://polygon.instadapp.io/aave-v2',
      defiURL: aaveDefiURL,
    },
    {
      protocol: 'aave-v2',
      protocolId: 1,
      apiPath: '/avalanche/aave/v2/position',
      chainId: 43114,
      logoURI: AaveV2Url,
      label: 'Aave V2',
      instadappURL: 'https://avalanche.instadapp.io/aave-v2',
      defiURL: aaveDefiURL,
    },
    {
      apiPath: '',
      label: 'Instadapp Lite',
      chainId: 1,
      protocol: 'lite',
      protocolId: 0,
      logoURI: LiteUrl,
      defiURL: liteDefiURL,
      instadappURL: liteDefiURL,
    },
  ]

  const getDefiProtocolName = (protocol: string) => defaultDefiApis.find(d => d.protocol === protocol)?.label

  const defiApis = computed(() => defaultDefiApis)

  async function fetchPositions() {
    positions.value = []

    const positionApis = getPositionApis()

    const resp = await Promise.allSettled(positionApis)

    positions.value = resp
      .filter((r): r is PromiseFulfilledResult<any> => {
        if (r.status === 'fulfilled') { return true }
        else {
          console.error(r.reason)
          return false
        }
      })
      .flatMap(r => r.value)
  }

  function getPositionApis() {
    return defiApis.value.map(async (api) => {
      return fetchDefiPosition(api).then((item) => {
        const data = [] as Positions[]

        const position = item as Positions

        data.push(position)

        let currentPosition = positions.value.find(
          i => i.id === position.id,
        )

        if (currentPosition)
          currentPosition = position
        else
          positions.value.push(position)

        return data
      })
    })
  }

  const availablePositions = computed<Positions[]>(() => {
    return positions.value
      .flatMap((p) => {
        if (p.protocol === 'lite') {
          const position = p.positions as any
          const suppliedTokens = [
            {
              key: 'eth',
              price: position.token?.price,
              supply: position.userSupplyAmount,
            },
          ]
          return {
            ...p,
            healtFactor: '1',
            apy: position.apy.apyWithoutFee,
            positions: {
              totalSupplyInUsd: toBN(position.userSupplyAmount).times(position.token?.price).toFixed(),
              totalBorrowInUsd: '0',
              ...position,
            },
            suppliedTokens,
          }
        }

        if (p.protocol === 'compound-v3') {
          const positions = p.positions as unknown as any[]

          return positions.map((i) => {
            const borrowedTokens = [
              {
                key: i.baseConfig.key,
                price: div(i.basePosition.borrowInUsd, i.basePosition.borrow).toFixed(),
                borrow: i.basePosition.borrow,
              },
            ]

            const suppliedTokens = getCommonSuppliedTokens(i.tokens)

            return {
              ...p,
              label: `${p.label} (${i.marketName})`,
              healtFactor: '1', // TODO: add healtFactor
              apy: '0', // TODO: add apy
              borrowedTokens,
              suppliedTokens,
              positions: i,
            }
          })
        }

        else if (p.protocol === 'makerdao') {
          const positions = p.positions as unknown as any[]

          return positions.map((i: any) => {
            i.totalSupplyInUsd = times(i.collateral, i.price).toFixed()
            i.totalBorrowInUsd = times(i.debt, 1).toFixed()

            const suppliedTokens = [{
              key: i.tokenKey,
              price: i.price,
              supply: div(i.totalSupplyInUsd, i.price).toFixed(),
            }]

            const borrowedTokens = [{
              key: i.tokenKey,
              price: i.price,
              borrow: div(i.totalBorrowInUsd, i.price).toFixed(),
            }]

            return {
              ...p,
              label: `${p.label} ${i.type} (#${i.id})`,
              healtFactor: '1', // TODO: add healtFactor
              apy: i.rate,
              borrowedTokens,
              suppliedTokens,
              positions: i,
              vaultId: i.id,
            }
          })
        }
        else {
          return {
            ...p,
            apy: p?.apy || calculateCommonAPY(p.positions.data || []),
            healtFactor: p?.healtFactor || '1', // TODO: add health factor
            borrowedTokens: p?.borrowedTokens || getCommonBorrowedTokens(p.positions?.data || []),
            suppliedTokens: p?.suppliedTokens || getCommonSuppliedTokens(p.positions.data || []),
          }
        }
      })
      .filter(i => gt(i.positions?.totalSupplyInUsd, 0))
      .sort((a, b) =>
        toBN(b.positions?.totalSupplyInUsd)
          .minus(a.positions?.totalSupplyInUsd)
          .toNumber(),
      )
  })

  const summarize = computed(() => {
    const total = availablePositions.value.reduce((acc, curr) => {
      const { totalSupplyInUsd, totalBorrowInUsd } = curr.positions

      acc.totalSupplyInUsd = plus(acc.totalSupplyInUsd, totalSupplyInUsd).toString()
      acc.totalBorrowInUsd = plus(acc.totalBorrowInUsd, totalBorrowInUsd).toString()

      return acc
    }, {
      totalSupplyInUsd: '0',
      totalBorrowInUsd: '0',
    })

    return [
      {
        name: 'Lend',
        value: formatUsd(total.totalSupplyInUsd),
        color: 'bg-[#56CCF2]',
        icon: resolveComponent('SvgoMoneyLend'),
      },
      {
        name: 'Borrowed',
        value: formatUsd(total.totalBorrowInUsd),
        color: 'bg-[#9B51E0]',
        icon: resolveComponent('SvgoMoneyBorrowed'),
      },
      {
        name: 'APY',
        value: formatPercent('0'),
        color: 'bg-[#2F80ED]',
        icon: resolveComponent('SvgoPercent'),
      },
    ]
  })

  function getCommonSuppliedTokens(positions: any[]) {
    if (!positions)
      return []
    return positions.filter((i: any) => gt(i.supply, 0))
  }

  function getCommonBorrowedTokens(positions: any[]) {
    if (!positions)
      return []
    return positions.filter((i: any) => gt(i.borrow, 0))
  }

  function calculateCommonAPY(positions: any[]) {
    return positions.reduce((acc: any, curr: any) => {
      const supplyYield = toBN(curr?.supplyYield || curr?.supplyRate)
      const borrowYield = toBN(curr?.borrowYield || curr?.borrowRate)
      const supply = toBN(curr?.supply)
      const borrow = toBN(curr?.borrow)
      const priceInUsd = toBN(curr?.priceInUsd)
      const totalSupplyYield = supplyYield.plus(curr?.supplyRewardRate || curr?.compSupplyApy)
      const totalBorrowYield = borrowYield.plus(curr?.borrowRewardRate || curr?.compBorrowApy)

      const interest = supply
        .times(totalSupplyYield)
        .minus(borrow.times(totalBorrowYield))
        .times(priceInUsd)

      return toBN(acc).plus(interest)
    }, 0)
  }

  async function fetchDefiPosition(api: DefiApis) {
    if (api.protocol === 'lite') {
      const vaults = await axios.get<any[]>(`https://api.instadapp.io/v2/mainnet/lite/users/${safeAddress.value}/vaults`, {
        timeout: 20000,
      })

      const v2EthVault = vaults.data?.find((v: any) => v.version === '2' && v.tokenAddress === ethAddress)

      return {
        ...api,
        positions: v2EthVault,
        id: api.apiPath + api.label,
      } as Positions
    }

    const response = await axios.get(
            `https://api.instadapp.io/defi${api.apiPath}`,
            {
              params: {
                user: safeAddress.value,
              },
              timeout: 20000,
            },
    )

    return {
      ...api,
      positions: response.data,
      id: api.apiPath + api.label,
    } as Positions
  }

  function calculateHealthFactor(healtFactor: number | string) {
    const maxHealthFactor = '1.15'
    const minHealthFactor = '1.1'

    if (gt(healtFactor, maxHealthFactor)) {
      return {
        label: 'Safe',
        isRisky: false,
      }
    }
    if (
      gt(healtFactor, minHealthFactor)
    && lt(healtFactor, maxHealthFactor)
    ) {
      return {
        label: 'Moderate',
        isRisky: false,
        isModerate: true,
      }
    }
    if (lt(healtFactor, minHealthFactor)) {
      return {
        label: 'Very Risky',
        isRisky: true,
      }
    }
    return {
      label: 'Safe',
      isRisky: false,
    }
  }

  return {
    availablePositions,
    summarize,
    fetchPositions,
    getDefiProtocolName,
    calculateHealthFactor,
  }
}
