import axios from 'axios'
import { storeToRefs } from 'pinia'
import AaveV2Url from '~/assets/images/protocols/aave-v2.svg?url'
import CompoundUrl from '~/assets/images/protocols/compound.svg?url'
import MakerUrl from '~/assets/images/protocols/makerdao.svg?url'
import LiteUrl from '~/assets/images/protocols/instadapp-lite.svg?url'

export function useDefi() {
  const { safeAddress } = useAvocadoSafe()
  const { tokens } = storeToRefs(useTokens())

  const positions = ref<Positions[]>([])

  const makerdaoDefiURL = 'https://makerdao.com'
  const compoundDefiURL = 'https://compound.finance'
  const aaveDefiURL = 'https://app.aave.com'
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
      protocol: 'compound-v3',
      protocolId: 4,
      apiPath: '/polygon/compound/v3/position',
      chainId: 137,
      logoURI: CompoundUrl,
      label: 'Compound V3',
      instadappURL: 'https://polygon.instadapp.io/compound-v3',
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
      instadappURL: '',
      label: 'Instadapp Lite',
      chainId: 1,
      protocol: 'lite',
      protocolId: 0,
      logoURI: LiteUrl,
      defiURL: liteDefiURL,
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
        let healthFactor = '∞'

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
            healthFactor: '-',
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

            const totalBorrowedAmount = parseFloat(i.basePosition.borrowInUsd)

            const suppliedTokens = getCommonSuppliedTokens(i.tokens)

            if (gt(i.basePosition.supply, '0')) {
              suppliedTokens.push({
                key: i.baseConfig.key,
                price: i.basePosition.priceInBase,
                supply: i.basePosition.supply,
                supplyInUsd: i.basePosition.supplyInUsd,
              })
            }

            const totalSuppliedAmount = suppliedTokens.reduce((sum, j) => {
              return sum + parseFloat(j.supplyInUsd)
            }, 0)

            const netAssets = totalSuppliedAmount - totalBorrowedAmount

            const stakingInterestGenerated = i.tokens.reduce((accum: any, t: any) => {
              if (t.key === 'wsteth' || t.key === 'cbeth')
                return plus(accum, times(t?.supplyInUsd, t?.stakingApr?.netStakingApr))

              return accum
            }, toBN(0))

            // Either the supply or borrow will be 0, making the interstGenerated positive or negative
            const interstGenerated = minus(
              plus(
                times(i.basePosition.supplyInUsd, plus(div(i.basePosition.supplyAPY, 100), i.rewards[0].supplyApy)),
                stakingInterestGenerated)
              , times(i.basePosition.borrowInUsd, minus(div(i.basePosition.borrowAPY, 100), i.rewards[0].borrowApy)))

            const netAPY = times(div(interstGenerated, netAssets), 100)

            return {
              ...p,
              label: `${p.label} (${i.marketName})`,
              healthFactor: toBN(i.healthFactor).gt(1e29) ? '∞' : parseFloat(i.healthFactor).toFixed(2),
              apy: netAPY.toFixed(2),
              borrowedTokens,
              suppliedTokens,
              positions: i,
            }
          })
        }

        else if (p.protocol === 'makerdao') {
          const positions = p.positions as unknown as any[]

          return positions.map((i: any) => {
            const dai = tokens.value.find(t => t.symbol === 'dai')
            const price = dai?.price || 1

            i.totalSupplyInUsd = times(i.collateral, i.price).toFixed()
            i.totalBorrowInUsd = times(i.debt, 1).toFixed()

            const suppliedTokens = [{
              key: i.tokenKey,
              price: i.price,
              supply: i.collateral,
            }]

            const borrowedTokens = [{
              key: 'dai',
              price,
              borrow: i.debt,
            }]

            const healthFactor = i.debt.toString() === '0'
              ? '∞'
              : div(times(times(i.collateral, i.price), i.liquidation), i.debt).toFixed(2) // Assuming DAI = $1

            return {
              ...p,
              label: `${p.label} ${i.type} (#${i.id})`,
              healthFactor,
              apy: times(i.rate, 100).toFixed(2),
              borrowedTokens,
              suppliedTokens,
              positions: i,
              vaultId: i.id,
            }
          })
        }

        else if (p.protocol === 'compound') {
          const positionsData = p.positions.data as unknown as any[]

          // Health factor (sum of (supplyInUsd * factor)/ sum of debtInUsd)
          const healthFactorCollateralUsageUSD = positionsData.reduce((acc: any, i: any) => {
            const currentHealthFactor = times(times(i.supply, i.priceInUsd), i.factor)
            return acc + Number(currentHealthFactor)
          }, 0)

          healthFactor = p.positions.totalBorrowInUsd.toString() === '0'
            ? '∞'
            : div(healthFactorCollateralUsageUSD, p.positions.totalBorrowInUsd).toFixed(2)
        }

        return [
          {
            ...p,
            apy: p?.apy || calculateCommonAPY(p.positions.data || [], p.positions?.compPriceInUsd),
            healthFactor: p.positions.healthFactor
              ? toBN(p.positions.healthFactor).gt(1e29) ? '∞' : toBN(p.positions.healthFactor).toFixed(2)
              : healthFactor || '1',
            borrowedTokens: p?.borrowedTokens || getCommonBorrowedTokens(p.positions?.data || []),
            suppliedTokens: p?.suppliedTokens || getCommonSuppliedTokens(p.positions.data || []),
          } as Positions,
        ]
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

      const interestFromProtocol = times(div(curr.apy, 100), minus(totalSupplyInUsd, totalBorrowInUsd))

      acc.totalSupplyInUsd = plus(acc.totalSupplyInUsd, totalSupplyInUsd).toString()
      acc.totalBorrowInUsd = plus(acc.totalBorrowInUsd, totalBorrowInUsd).toString()
      acc.totalInterestFromProtocol = plus(acc.totalInterestFromProtocol, interestFromProtocol).toString()

      return acc
    }, {
      totalSupplyInUsd: '0',
      totalBorrowInUsd: '0',
      totalInterestFromProtocol: '0',
    })

    const totalNetAssets = minus(total.totalSupplyInUsd, total.totalBorrowInUsd)
    const aggregatedAPY = div(total.totalInterestFromProtocol, totalNetAssets).toFixed(4)

    return [
      {
        name: 'Supplied',
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
        name: 'Net APY',
        value: formatPercent(toBN(aggregatedAPY).isNaN() ? '0' : aggregatedAPY),
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
    return positions.filter((i: any) => gt(i.borrow, 0) || gt(i?.borrowStable, '0'))
  }

  function calculateCommonAPY(positions: any[], compPriceInUSD?: string | number) {
    const totalInterest
    = positions.reduce((acc: any, curr: any) => {
      const supplyYield = toBN(curr?.supplyYield || curr?.supplyRate)
      const borrowYield = toBN(curr?.borrowYield || curr?.borrowRate)
      const supply = toBN(curr?.supply)
      const borrow = toBN(curr?.borrow)
      const priceInUsd = toBN(curr?.priceInUsd)
      let totalSupplyYield = supplyYield.plus(curr?.supplyRewardRate || toBN(curr?.compSupplyApy).times(toBN(compPriceInUSD ?? '64.9')))
      let totalBorrowYield = borrowYield.minus(curr?.borrowRewardRate || toBN(curr?.compBorrowApy).times(toBN(compPriceInUSD ?? '64.9')))

      const stakingTokenExists
      = curr?.key === 'wsteth'
      || curr?.key === 'steth'
      || curr?.key === 'stmatic'
      || curr?.key === 'savax'
      || curr?.key === 'cbeth'

      const stakingYield = stakingTokenExists ? toBN(curr?.stakingApr?.netStakingApr) : toBN(0)

      totalSupplyYield = totalSupplyYield.plus(stakingYield)
      totalBorrowYield = totalBorrowYield.plus(stakingYield)

      const interest = supply
        .times(totalSupplyYield)
        .minus(borrow.times(totalBorrowYield))
        .times(priceInUsd)

      return toBN(acc).plus(interest)
    }, 0)

    const totalSuppliedAmount = positions.reduce((sum: any, curr: any) => {
      return toBN(sum).plus(toBN(curr?.supply).times(toBN(curr?.priceInUsd)))
    }, 0)

    const totalBorrowedAmount = positions.reduce((sum: any, curr: any) => {
      return toBN(sum).plus(toBN(curr?.borrow).times(toBN(curr?.priceInUsd)))
    }, 0)

    const netAssets = totalSuppliedAmount.minus(totalBorrowedAmount)

    const apy = netAssets.gt(0) ? toBN(totalInterest).dividedBy(netAssets).times(100).toFixed(4) : '0'

    return apy
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

  function calculateHealthFactor(healthFactor: number | string) {
    const maxHealthFactor = '1.15'
    const minHealthFactor = '1.1'

    if (gt(healthFactor, maxHealthFactor)) {
      return {
        label: 'Safe',
        isRisky: false,
      }
    }
    if (
      gt(healthFactor, minHealthFactor)
    && lt(healthFactor, maxHealthFactor)
    ) {
      return {
        label: 'Moderate',
        isRisky: false,
        isModerate: true,
      }
    }
    if (lt(healthFactor, minHealthFactor)) {
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
    defaultDefiApis,
  }
}
