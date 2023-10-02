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

    <MigrationBalances v-show="activeTab === 'balances'" class="h-[calc(100%-39px)] overflow-y-auto scroll-style" />
    <MigrationNFTs v-show="activeTab === 'nfts'" class="h-[calc(100%-39px)] overflow-y-auto" />
    <!-- <Defi v-show="activeTab === 'defi'" class="h-[calc(100%-39px)] overflow-y-auto" /> -->
  </div>
</template>
