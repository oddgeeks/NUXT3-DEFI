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

const defiApis = computed<DefiApis[]>(() => [
  {
    protocol: 'makerdao',
    apiPath: '/mainnet/makerdao/vaults',
    proceedOnNativeNetwork: true,
    protocolId: 6,
    chainId: 1,
    logoURI: MakerUrl,
    label: 'MakerDAO',
  },
  {
    protocol: 'compound',
    apiPath: '/mainnet/compound/position',
    protocolId: 3,
    chainId: 1,
    logoURI: CompoundUrl,
    label: 'Compound',
  },
  {
    protocol: 'compound-v3',
    protocolId: 4,
    apiPath: '/mainnet/compound/v3/position',
    chainId: 1,
    logoURI: CompoundUrl,
    label: 'Compound V3',
  },

  {
    protocol: 'aave-v3',
    protocolId: 2,
    apiPath: '/mainnet/aave/v3/position',
    chainId: 1,
    logoURI: AaveV2Url,
    label: 'Aave V3',
  },
  {
    protocol: 'aave-v3',
    protocolId: 2,
    apiPath: '/polygon/aave/v3/position?stMaticApiCall=false',
    chainId: 137,
    logoURI: AaveV2Url,
    label: 'Aave V3',
  },
  {
    protocol: 'aave-v3',
    protocolId: 2,
    apiPath: '/arbitrum/aave/v3/position',
    chainId: 42161,
    logoURI: AaveV2Url,
    label: 'Aave V3',
  },
  {
    protocol: 'aave-v3',
    protocolId: 2,
    apiPath: '/avalanche/aave/v3/position',
    chainId: 43114,
    logoURI: AaveV2Url,
    label: 'Aave V3',
  },
  {
    protocol: 'aave-v3',
    protocolId: 2,
    apiPath: '/optimism/aave/v3/position',
    chainId: 10,
    logoURI: AaveV2Url,
    label: 'Aave V3',
  },

  {
    protocol: 'aave-v2',
    protocolId: 1,
    apiPath: '/mainnet/aave/v2/position',
    chainId: 1,
    logoURI: AaveV2Url,
    label: 'Aave V2',
  },
  {
    protocol: 'aave-v2',
    protocolId: 1,
    apiPath: '/polygon/aave/v2/position',
    chainId: 137,
    logoURI: AaveV2Url,
    label: 'Aave V2',
  },

  {
    protocol: 'aave-v2',
    protocolId: 1,
    apiPath: '/avalanche/aave/v2/position',
    chainId: 43114,
    logoURI: AaveV2Url,
    label: 'Aave V2',
  },
])

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
            positions: i,
            vaultId: i.id,
          }
        })
      }
      else { return p }
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
          <tr v-for="position in filteredPositions" :key="position.label + position.chainId">
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
            <td>
              {{ formatUsd(position.positions?.totalBorrowInUsd) }}
            </td>
            <td class="pl-10">
              11
            </td>
            <td class="pl-10">
              {{ formatDecimal(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>

</style>
