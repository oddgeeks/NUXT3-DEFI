<script setup lang="ts">
const { account } = useWeb3();
const { data } = useNuxtData("allNetworkVersions");
</script>

<template>
  <div class="mx-auto max-w-[880px] w-full flex-1">
    <div class="mb-7.5 max-w-[796px] w-full">
      <h1 class="text-3xl font-bold leading-10 mb-2.5">
        Upgrade Avocado’s Smart Contracts
      </h1>
      <h2 class="text-slate-400 font-medium text-sm">
        Avocado wallet is a Smart Contract wallet, it is recommended that you
        keep your Smart Contract upgraded to make the most of Avocado.
      </h2>
    </div>
    <div class="h-full relative">
      <div
        :class="{ 'blur h-full': !account || !data }"
        class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex-1 relative"
      >
        <table class="table w-full">
          <thead>
            <tr
              class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
            >
              <th class="text-left py-6 pl-7.5">Network</th>
              <th class="py-5">Latest version</th>
              <th class="py-5 text-center">
                <span class="opacity-0">Action</span>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <NetworkUpgradeRow
              :network="network"
              :key="network.chainId"
              v-for="network in data"
            />
          </tbody>
        </table>
      </div>
      <div
        v-if="!account"
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
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
