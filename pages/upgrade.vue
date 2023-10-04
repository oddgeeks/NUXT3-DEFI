<script setup lang="ts">
import { gt } from 'semver'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { safeOptions, optionsLoading } = storeToRefs(useSafe())

useEagerConnect()

const sortByVersion = computed(() => {
  return safeOptions.value?.sort((a, b) => {
    return gt(a.latestVersion || '0.0.0', b.latestVersion || '0.0.0') ? -1 : 1
  })
})

const mostRecentVersion = computed(() => {
  return safeOptions.value?.sort((a, b) => {
    return gt(a.latestVersion || '0.0.0', b.latestVersion || '0.0.0') ? -1 : 1
  })[0]?.latestVersion
})
</script>

<template>
  <div class="mt-3 w-full max-w-[880px] flex-1 px-5 sm:mx-auto">
    <div class="mb-5 w-full max-w-[796px] sm:mb-7.5">
      <h1 class="leading-7.5 mb-2.5 flex items-center gap-2 text-xl font-bold sm:text-3xl">
        Upgrade your Avocado Wallet
        <SvgSpinner v-if="optionsLoading" class="text-primary" />
      </h1>
      <h2 class="text-xs font-medium leading-6 text-slate-400 sm:text-sm">
        Avocado wallet is a Smart Contract wallet, it is recommended that you
        keep your Smart Contract upgraded to make the most of Avocado.
      </h2>
    </div>
    <div class="relative mb-7.5 h-full sm:mb-0">
      <div
        :class="{ 'h-full blur': !account || !safeOptions }"
        class="relative flex-1 rounded-5 bg-slate-50 dark:bg-gray-850 sm:rounded-[25px]"
      >
        <table class="table w-full">
          <thead>
            <tr
              class="hidden border-b border-slate-150 text-left text-sm font-medium text-gray-400 dark:border-slate-800 sm:table-row"
            >
              <th class="py-6 pl-7.5 text-left">
                Network
              </th>
              <th class="py-5">
                Latest version
              </th>
              <th class="py-5 text-center">
                <span class="opacity-0">Action</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 dark:divide-slate-800">
            <NetworkUpgradeRow
              v-for="options in sortByVersion"
              :key="options.chainId"
              :options="options"
              :recent-version="mostRecentVersion"
            />
          </tbody>
        </table>
      </div>
      <div
        v-if="!account"
        class="absolute left-1/2 top-1/2 flex -translate-x-1/2 items-center justify-center sm:-translate-y-1/2"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p class="whitespace-nowrap text-lg font-semibold">
            Connect your wallet to upgrade
          </p>

          <div class="w-28">
            <Web3Button />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
