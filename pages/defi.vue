<script setup lang="ts">
import Fuse from 'fuse.js'

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { account } = useWeb3()

const searchQuery = ref('')

const { availablePositions, summarize } = storeToRefs(useDefi())

const { getDefiProtocolName, defaultDefiApis } = useDefi()

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
</script>

<template>
  <div class="flex flex-1 flex-col gap-7.5">
    <div class="flex w-full flex-wrap items-center justify-between">
      <h1 class="text-sm sm:text-base">
        Your DeFi Positions
      </h1>
      <MultipleNetworkFilter v-if="account" v-model:networks="networkPreferences" :show-supported-networks="false" :filters="false" />
    </div>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div v-for="item in summarize" :key="item.name" class="flex items-center gap-4 rounded-3xl bg-slate-50 px-4 py-3 dark:bg-gray-850 sm:p-5">
        <div :class="item.color" class="flex h-11 w-11 items-center justify-center rounded-2xl bg-opacity-10 sm:h-[50px] sm:w-[50px]">
          <component :is="item.icon" />
        </div>
        <div class="flex flex-col gap-0.5">
          <h1 class="text-xs text-gray-500 sm:text-sm">
            {{ item.name }}
          </h1>
          <h2 class="text-2xl leading-[30px] sm:text-3xl sm:leading-10">
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
        class="scroll-style hidden max-h-[530px] overflow-auto rounded-[25px] bg-slate-50 dark:bg-gray-850 sm:flex md:overflow-x-hidden"
      >
        <table
          class="table w-full"
        >
          <thead>
            <tr
              class="border-b border-slate-150 text-left text-sm font-medium text-gray-400 dark:border-gray-800"
            >
              <th class="py-6 pl-7.5 text-left">
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
              <th class="whitespace-nowrap py-5 pl-10">
                Health Factor
              </th>
              <th class="py-5" />
              <th class="py-5" />
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 dark:divide-gray-900">
            <tr
              v-for="position in filteredPositions"
              :key="position.label + position.chainId"
              class="cursor-pointer" @click="openDefiPositionDetailsModal(position)"
            >
              <td class="py-[26px] pl-7.5">
                <div class="flex w-fit items-center gap-3">
                  <div
                    class="relative inline-block h-7.5 w-7.5 shrink-0 rounded-full"
                  >
                    <img
                      class="h-7.5 w-7.5 rounded-full"
                      :src="position.logoURI"
                      :alt="position.label"
                    >

                    <ChainLogo
                      :stroke="true"
                      class="absolute -bottom-1 -right-1 h-4 w-4"
                      :chain="position.chainId"
                    />
                  </div>
                  <span class="whitespace-nowrap sm:whitespace-normal">
                    {{ position.label }}
                  </span>
                </div>
              </td>
              <td>
                {{ `$${abbreviateNumber(position.positions?.totalSupplyInUsd)}` }}
              </td>
              <td class="py-5 pl-7.5">
                {{ `$${abbreviateNumber(position.positions?.totalBorrowInUsd)}` }}
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

      <ul class="flex flex-col gap-5 sm:hidden">
        <li
          v-for="position in filteredPositions"
          :key="position.label + position.chainId"
          class="flex flex-col gap-3 rounded-5 bg-slate-50 dark:bg-gray-850"
        >
          <button class="flex w-full justify-between border-b border-slate-150 px-5 py-4 dark:border-gray-800" @click="openDefiPositionDetailsModal(position)">
            <div class="flex items-center gap-3">
              <div
                class="relative inline-block h-7.5 w-7.5 shrink-0 rounded-full"
              >
                <img
                  class="h-7.5 w-7.5 rounded-full"
                  :src="position.logoURI"
                  :alt="position.label"
                >

                <ChainLogo
                  :stroke="true"
                  class="absolute -bottom-1 -right-1 h-4 w-4"
                  :chain="position.chainId"
                />
              </div>
              <span class="w-[160px] text-left text-sm">
                {{ position.label }}
              </span>
            </div>
            <CommonButton class="h-fit whitespace-nowrap !px-4 text-xs" color="white" :href="position.defiURL" target="_blank" as="a" @click.stop>
              {{ getDefiProtocolName(position.protocol) || position.label }}
            </CommonButton>
          </button>
          <div class="">
            <dl class="grid grid-cols-2 gap-y-4">
              <div class="border-b border-slate-150 px-5 pb-4 dark:border-gray-800">
                <dt class="text-xs leading-5 text-gray-500">
                  Supplied
                </dt>
                <dd class="text-sm">
                  {{ `$${abbreviateNumber(position.positions?.totalSupplyInUsd)}` }}
                </dd>
              </div>
              <div class="border-b border-slate-150 dark:border-gray-800">
                <dt class="text-xs leading-5 text-gray-500">
                  Borrowed
                </dt>
                <dd class="text-sm">
                  {{ `$${abbreviateNumber(position.positions?.totalBorrowInUsd)}` }}
                </dd>
              </div>
              <div class="px-5 pb-4">
                <dt class="text-xs leading-5 text-gray-500">
                  APY
                </dt>
                <dd class="text-sm">
                  {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs leading-5 text-gray-500">
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
        class="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 translate-y-1/2 items-center justify-center sm:-translate-y-1/2"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p
            class="text-center font-semibold leading-[30px] text-gray-400 sm:whitespace-nowrap sm:text-lg sm:text-white"
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
