<script setup lang="ts">
import { gt } from 'semver'

definePageMeta({
  middleware: 'auth',
})

const { account } = useWeb3()
const { data } = useNuxtData('allNetworkVersions')

useEagerConnect()

const sortByVersion = computed(() => {
  return data.value?.sort((a: NetworkVersion, b: NetworkVersion) => {
    return gt(a.latestVersion, b.latestVersion) ? -1 : 1
  })
})

const mostRecentVersion = computed(() => {
  return data.value?.sort((a: NetworkVersion, b: NetworkVersion) => {
    return gt(a.latestVersion, b.latestVersion) ? -1 : 1
  })[0]?.latestVersion
})
</script>

<template>
  <div class="px-5 sm:mx-auto max-w-[880px] w-full flex-1 mt-3">
    <div class="mb-5 sm:mb-7.5 max-w-[796px] w-full">
      <h1 class="text-xl sm:text-3xl font-bold leading-7.5 mb-2.5">
        Upgrade your Avocado Wallet
      </h1>
      <h2 class="text-slate-400 leading-6 font-medium text-xs sm:text-sm">
        Avocado wallet is a Smart Contract wallet, it is recommended that you
        keep your Smart Contract upgraded to make the most of Avocado.
      </h2>
    </div>
    <div class="h-full relative mb-7.5 sm:mb-0">
      <div
        :class="{ 'blur h-full': !account || !data }"
        class="dark:bg-gray-850 bg-slate-50 rounded-5 sm:rounded-[25px] flex-1 relative"
      >
        <table class="table w-full">
          <thead>
            <tr
              class="hidden sm:table-row text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
            >
              <th class="text-left py-6 pl-7.5">
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
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <NetworkUpgradeRow
              v-for="network in sortByVersion"
              :key="network.chainId"
              :network="network"
              :recent-version="mostRecentVersion"
            />
          </tbody>
        </table>
      </div>
      <div
        v-if="!account"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 sm:-translate-y-1/2 flex items-center justify-center"
      >
        <div class="flex flex-col items-center justify-center gap-6">
          <p class="font-semibold text-lg whitespace-nowrap">
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
