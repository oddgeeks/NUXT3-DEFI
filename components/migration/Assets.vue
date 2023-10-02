<script setup lang="ts">
const activeTab = ref('balances')

const tabs = [
  {
    name: 'Balances',
    value: 'balances',
  },
  {
    name: 'NFTs',
    value: 'nfts',
  },
  {
    name: 'Gas',
    value: 'gas',
  },
  // TODO: hide DeFi while it's not implemented yet
  // {
  //   name: 'DeFi Positions',
  //   value: 'defi',
  // },
]
</script>

<template>
  <div class="overflow-y-hidden">
    <MigrationTabs
      class="border-b-[1px] dark:border-slate-750 border-white"
      :tabs="tabs"
      :default-selected="activeTab"
      @updated="(newValue) => activeTab = newValue"
    />

    <MigrationBalances v-if="activeTab === 'balances'" class="h-[calc(100%-39px)] overflow-y-auto scroll-style" />
    <MigrationNFTs v-else-if="activeTab === 'nfts'" class="h-[calc(100%-39px)] overflow-y-auto" />
    <MigrationGas v-else-if="activeTab === 'gas'" />
    <!-- <Defi v-show="activeTab === 'defi'" class="h-[calc(100%-39px)] overflow-y-auto" /> -->
  </div>
</template>
