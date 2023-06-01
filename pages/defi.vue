<script setup lang="ts">
import Fuse from 'fuse.js'
import axios from 'axios'
import AaveV2Url from '~/assets/images/protocols/aave-v2.svg?url'
import CompoundUrl from '~/assets/images/protocols/compound.svg?url'
import MakerUrl from '~/assets/images/protocols/makerdao.svg?url'

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { safeAddress } = useAvocadoSafe()

const positions = ref<Positions[]>([])

const searchQuery = ref('')

const makerdaoDefiURL = 'https://makerdao.com'
const compoundDefiURL = 'https://compound.finance'
const aaveDefiURL = 'https://aave.com'

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
]

const getDefiProtocolName = (protocol: string) => defaultDefiApis.find(d => d.protocol === protocol)?.label

const defiApis = computed(() => defaultDefiApis)

async function fetchPositions() {
  positions.value = []
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

function getPositionApis() {
  return defiApis.value.map(async (api) => {
    const { apiPath } = api

    const accounts = [safeAddress.value]

    return Promise.allSettled(
      accounts.map(async (address) => {
        const response = await axios.get(
            `https://api.instadapp.io/defi${apiPath}`,
            {
              params: {
                user: address,
              },
              timeout: 20000,
            },
        )

        return {
          ...api,
          positions: response.data,
          id: apiPath + api.label,
        } as Positions
      }),
    ).then((resp) => {
      const data = [] as Positions[]

      for (const item of resp) {
        if (item.status === 'fulfilled') {
          const position = item.value as Positions

          data.push(position)

          let currentPosition = positions.value.find(
            i => i.id === position.id,
          )

          if (currentPosition)
            currentPosition = position
          else
            positions.value.push(position)
        }
      }

      return data
    })
  })
}

const availablePositions = computed<Positions[]>(() => {
  return positions.value
    .flatMap((p) => {
      if (p.protocol === 'compound-v3') {
        const positions = p.positions as unknown as any[]

        return positions.map((i) => {
          return {
            ...p,
            label: `${p.label} (${i.marketName})`,
            apy: actions[p.protocol].getApy(i),
            borrowedTokens: actions[p.protocol].getBorrowedTokens(i),
            suppliedTokens: actions[p.protocol].getSuppliedTokens(i),
            positions: i,
          }
        })
      }

      else if (p.protocol === 'makerdao') {
        return p.positions.map((i: any) => {
          i.totalSupplyInUsd = times(i.collateral, i.price).toFixed()
          i.totalBorrowInUsd = times(i.debt, 1).toFixed()

          return {
            ...p,
            label: `${p.label} ${i.type} (#${i.id})`,
            apy: actions[p.protocol].getApy(i),
            borrowedTokens: actions[p.protocol].getBorrowedTokens(i),
            suppliedTokens: actions[p.protocol].getSuppliedTokens(i),
            positions: i,
            vaultId: i.id,
          }
        })
      }
      else {
        return {
          ...p,
          apy: actions[p.protocol].getApy(p.positions),
          borrowedTokens: actions[p.protocol].getBorrowedTokens(p.positions),
          suppliedTokens: actions[p.protocol].getSuppliedTokens(p.positions),
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

const actions: Record<ImportProtocolKeys, IDefiActions> = {
  'aave-v2': {
    getApy: positions => calculateCommonAPY(positions.data),
    getSuppliedTokens: positions => getCommonSuppliedTokens(positions.data),
    getBorrowedTokens: positions => getCommonBorrowedTokens(positions.data),
  },
  'aave-v3': {
    getApy: positions => calculateCommonAPY(positions.data),
    getSuppliedTokens: positions => getCommonSuppliedTokens(positions.data),
    getBorrowedTokens: positions => getCommonBorrowedTokens(positions.data),
  },
  'compound': {
    getApy: positions => calculateCommonAPY(positions.data),
    getSuppliedTokens: positions => getCommonSuppliedTokens(positions.data),
    getBorrowedTokens: positions => getCommonBorrowedTokens(positions.data),
  },
  'makerdao': {
    getApy: vault => vault.rate,
    getSuppliedTokens: (vault) => {
      return [{
        key: vault.tokenKey,
        price: vault.price,
        supply: div(vault.totalSupplyInUsd, vault.price).toFixed(),
      }]
    },
    getBorrowedTokens: (vault) => {
      return [{
        key: vault.tokenKey,
        price: vault.price,
        borrow: div(vault.totalBorrowInUsd, vault.price).toFixed(),
      }]
    },
  },
  'compound-v3': {
    getApy: (positions) => {
      console.log(positions, 'not implemented yet')
      return '0'
    },
    getSuppliedTokens: positions => getCommonSuppliedTokens(positions.tokens),
    getBorrowedTokens: (positions) => {
      return [
        {
          key: positions.baseConfig.key,
          price: div(positions.basePosition.borrowInUsd, positions.basePosition.borrow).toFixed(),
          borrow: positions.basePosition.borrow,
        },
      ]
    },
  },
}

function getCommonSuppliedTokens(positions: any[]) {
  return positions.filter((i: any) => gt(i.supply, 0))
}

function getCommonBorrowedTokens(positions: any[]) {
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

const filteredPositions = computed(() => {
  if (!searchQuery.value)
    return availablePositions.value || []

  const fuse = new Fuse(availablePositions.value || [], {
    keys: ['label'],
    threshold: 0.2,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})

watch(safeAddress, () => {
  if (!safeAddress.value)
    return

  fetchPositions()
}, {
  immediate: true,
})
</script>

<template>
  <div class="flex-1 flex gap-7.5 flex-col">
    <h1>
      Your DeFi Positions
    </h1>
    <div class="grid grid-cols-3 gap-5">
      <div v-for="item in summarize" :key="item.name" class="dark:bg-gray-850 bg-slate-50 rounded-3xl p-5 flex items-center gap-4">
        <div :class="item.color" class="w-[50px] h-[50px] bg-opacity-10 rounded-2xl flex items-center justify-center">
          <component :is="item.icon" />
        </div>
        <div class="flex flex-col gap-0.5">
          <h1 class="text-slate-500 text-sm">
            {{ item.name }}
          </h1>
          <h2 class="text-3xl leading-10">
            {{ item.value }}
          </h2>
        </div>
      </div>
    </div>
    <CommonInput
      v-model="searchQuery"
      name="Defi Position Search"
      type="search"
      placeholder="Search name"
    >
      <template #prefix>
        <SvgoSearch class="shrink-0 mr-2" />
      </template>
    </CommonInput>
    <div
      style="scrollbar-gutter: stable; overflow-y: overlay"
      class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style"
    >
      <table
        class="table w-full"
      >
        <thead>
          <tr
            class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
          >
            <th class="text-left py-6 pl-7.5">
              Protocol
            </th>
            <th class="py-5">
              Supplied
            </th>
            <th class="py-5 pl-7.5">
              Borrowed
            </th>
            <th class="py-5 pl-10">
              APY
            </th>
            <th class="py-5 pl-10">
              Health Factor
            </th>
            <th class="py-5 pl-10" />
            <th class="py-5 pl-10" />
          </tr>
        </thead>
        <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
          <tr v-for="position in filteredPositions" :key="position.label + position.chainId" class="cursor-pointer" @click="openDefiPositionDetailsModal(position)">
            <td class="py-[26px] pl-7.5">
              <div class="flex items-center gap-3">
                <div
                  class="relative inline-block h-7.5 w-7.5 rounded-full flex-shrink-0"
                >
                  <img
                    class="h-7.5 w-7.5 rounded-full"
                    :src="position.logoURI"
                    :alt="position.label"
                  >

                  <ChainLogo
                    :stroke="true"
                    class="absolute w-4 h-4 -right-1 -bottom-1"
                    :chain="position.chainId"
                  />
                </div>
                {{ position.label }}
              </div>
            </td>
            <td>
              {{ formatUsd(position.positions?.totalSupplyInUsd) }}
            </td>
            <td class="py-5 pl-7.5">
              {{ formatUsd(position.positions?.totalBorrowInUsd) }}
            </td>
            <td class="pl-10">
              {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
            </td>
            <td class="pl-10">
              {{ formatDecimal(2) }}
            </td>
            <td class="pl-10">
              <CommonButton color="white" :href="position.defiURL" target="_blank" as="a" @click.stop>
                {{ getDefiProtocolName(position.protocol) }}
              </CommonButton>
            </td>
            <td class="pl-10">
              <CommonButton color="blue" :href="position.instadappURL" target="_blank" as="a" @click.stop>
                Instadapp
              </CommonButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>

</style>
