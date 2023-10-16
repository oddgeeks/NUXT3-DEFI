import axios from 'axios'
import { storeToRefs } from 'pinia'

export function useMigrationDefi() {
  const { safeAddress } = useAvocadoSafe()
  const { defaultDefiApis, getCommonBorrowedTokens, calculateCommonAPY, getCommonSuppliedTokens } = useDefi()
  const { tokens } = storeToRefs(useTokens())

  const positions = ref<MigrationPositions[]>([])

  function getPositionApis() {
    return defaultDefiApis.map(async (api) => {
      const { apiPath } = api

      let position: MigrationPositions

      if (api.protocol === 'lite') {
        const vaults = await axios.get<any[]>(`https://api.instadapp.io/v2/mainnet/lite/users/${safeAddress.value}/vaults`, {
          timeout: 20000,
        })

        const v2EthVault = vaults.data?.find((v: any) => v.version === '2' && v.tokenAddress === ethAddress)

        position = {
          ...api,
          positions: v2EthVault,
          id: api.apiPath + api.label,
        } as Positions
      }
      else {
        const response = await axios.get(
          `https://api.instadapp.io/defi${apiPath}`,
          {
            params: {
              user: safeAddress.value,
            },
            timeout: 20000,
          },
        )

        position = {
          ...api,
          positions: response.data,
          id: apiPath + safeAddress.value,
        } as MigrationPositions
      }

      let currentPosition = positions.value.find(
        i => i.id === position.id,
      )

      if (currentPosition)
        currentPosition = position
      else
        positions.value.push(position)

      return [position]
    })
  }

  const fetchPositions = async () => {
    if (!safeAddress.value)
      return

    const positionApis = getPositionApis()

    const resp = await Promise.allSettled(positionApis)

    positions.value = resp
      .filter((r) => {
        if (r.status === 'fulfilled') { return true }
        else {
          console.error(r.reason)
          return false
        }
      })
      .flatMap(r => r.value)
  }

  const availablePositions = computed<MigrationPositions[]>(() => {
    return positions.value.flatMap((p) => {
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
        } as MigrationPositions,
      ]
    })
      .filter(i => gt(i.positions?.totalSupplyInUsd, 0))
      .sort((a, b) =>
        toBN(b.positions?.totalSupplyInUsd)
          .minus(a.positions?.totalSupplyInUsd)
          .toNumber(),
      )
  })

  return {
    fetchPositions,
    positions,
    availablePositions,
  }
}
