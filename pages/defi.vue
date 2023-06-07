<script setup lang="ts">
import Fuse from 'fuse.js'

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { safeAddress } = useAvocadoSafe()
const { account } = useWeb3()

const searchQuery = ref('')

const { availablePositions, summarize, getDefiProtocolName, fetchPositions, defaultDefiApis } = useDefi()

const networkPreferences = ref(
  [...new Set(defaultDefiApis.map(i => i.chainId))],
)

const filteredPositions = computed(() => {
  const items = availablePositions.value?.filter(item =>
    networkPreferences.value.some(i => i == item.chainId),
  )

  if (!searchQuery.value)
    return items || []

  const fuse = new Fuse(items || [], {
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
    <div class="w-full flex items-center justify-between flex-wrap">
      <h1 class="sm:text-base text-sm">
        Your DeFi Positions
      </h1>
      <MultipleNetworkFilter v-if="account" v-model:networks="networkPreferences" :filters="false" />
    </div>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div v-for="item in summarize" :key="item.name" class="flex items-center gap-4 sm:p-5 px-4 py-3 dark:bg-gray-850 bg-slate-50 rounded-3xl">
        <div :class="item.color" class="sm:w-[50px] sm:h-[50px] w-11 h-11 bg-opacity-10 rounded-2xl flex items-center justify-center">
          <component :is="item.icon" />
        </div>
        <div class="flex flex-col gap-0.5">
          <h1 class="sm:text-sm text-xs text-slate-500">
            {{ item.name }}
          </h1>
          <h2 class="sm:text-3xl leading-[30px] text-2xl sm:leading-10">
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
        <SvgoSearch class="mr-2 shrink-0" />
      </template>
    </CommonInput>

    <div class="relative">
      <div
        :class="!account ? 'blur h-96' : ''"
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style"
      >
        <table
          class="table w-full"
        >
          <thead>
            <tr
              class="text-sm font-medium text-left text-gray-400 border-b border-slate-150 dark:border-slate-800"
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
              <th class="py-5 pl-10 whitespace-nowrap">
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
                <div class="flex items-center gap-3 w-fit">
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
                  <span class="sm:whitespace-normal whitespace-nowrap">
                    {{ position.label }}
                  </span>
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
              <td class="items-center pl-10 text-sm">
                <p class="flex items-center gap-2.5">
                  <DefiHealthFactorBadge :health-factor="position.healthFactor" />
                </p>
              </td>
              <td>
                <CommonButton class="whitespace-nowrap" color="white" :href="position.defiURL" target="_blank" as="a" @click.stop>
                  {{ getDefiProtocolName(position.protocol) || position.label }}
                </CommonButton>
              </td>
              <td class="pr-4">
                <CommonButton v-if="position.instadappURL" color="blue" :href="position.instadappURL" target="_blank" as="a" @click.stop>
                  Instadapp
                </CommonButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul class="sm:hidden flex-col flex gap-5">
        <li
          v-for="position in filteredPositions"
          :key="position.label + position.chainId"
          class="dark:bg-gray-850 flex-col bg-slate-50 rounded-5 flex gap-3"
        >
          <button class="flex justify-between w-full py-4 px-5 border-b dark:border-slate-800 border-slate-150" @click="openDefiPositionDetailsModal(position)">
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
              <span class="w-[160px] text-sm text-left">
                {{ position.label }}
              </span>
            </div>
            <CommonButton class="whitespace-nowrap text-xs h-fit !px-4" color="white" :href="position.defiURL" target="_blank" as="a" @click.stop>
              {{ getDefiProtocolName(position.protocol) || position.label }}
            </CommonButton>
          </button>
          <div class="">
            <dl class="grid grid-cols-2 gap-y-4">
              <div class="border-b dark:border-slate-800 border-slate-150 pb-4 px-5">
                <dt class="text-slate-500 text-xs leading-5">
                  Supplied
                </dt>
                <dd class="text-sm">
                  {{ formatUsd(position.positions?.totalSupplyInUsd) }}
                </dd>
              </div>
              <div class="border-b dark:border-slate-800 border-slate-150">
                <dt class="text-slate-500 text-xs leading-5">
                  Borrowed
                </dt>
                <dd class="text-sm">
                  {{ formatUsd(position.positions?.totalBorrowInUsd) }}
                </dd>
              </div>
              <div class="pb-4 px-5">
                <dt class="text-slate-500 text-xs leading-5">
                  APY
                </dt>
                <dd class="text-sm">
                  {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500 text-xs leading-5">
                  Health Factor
                </dt>
                <dd class="text-sm">
                  <DefiHealthFactorBadge :health-factor="position.healthFactor" />
                </dd>
              </div>
            </dl>
          </div>
          <CommonButton v-if="position.instadappURL" size="lg" class="mx-5 justify-center" color="blue" :href="position.instadappURL" target="_blank" as="a" @click.stop>
            Instadapp
          </CommonButton>
        </li>
      </ul>

      <div
        v-if="!account"
        class="flex items-center justify-center w-full absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 sm:-translate-y-1/2"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p
            class="font-semibold leading-[30px] text-slate-400 sm:text-white sm:text-lg sm:whitespace-nowrap text-center"
          >
            Connect your wallet to see your DeFi positions
          </p>

          <div class="w-28">
            <Web3Button />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
