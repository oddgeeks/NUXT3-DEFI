<script setup lang="ts">
import Fuse from 'fuse.js'

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { safeAddress } = useAvocadoSafe()

const searchQuery = ref('')

const { availablePositions, summarize, getDefiProtocolName, calculateHealthFactor, fetchPositions } = useDefi()

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
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
      class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] flex scroll-style"
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
            <th class="py-5" />
            <th class="py-5" />
          </tr>
        </thead>
        <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
          <tr
            v-for="position in filteredPositions"
            :key="position.label + position.chainId"
            class="cursor-pointer" @click="openDefiPositionDetailsModal(position)"
          >
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
            <td class="pl-10 text-sm items-center">
              <DefiHealthFactorBadge :healt-factor="position.healtFactor" />
            </td>
            <td>
              <CommonButton color="white" :href="position.defiURL" target="_blank" as="a" @click.stop>
                {{ getDefiProtocolName(position.protocol) || position.label }}
              </CommonButton>
            </td>
            <td>
              <CommonButton v-if="position.instadappURL" color="blue" :href="position.instadappURL" target="_blank" as="a" @click.stop>
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
