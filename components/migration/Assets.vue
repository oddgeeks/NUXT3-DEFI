<template>
  <div class="overflow-y-hidden">
    <MigrationTabs
      class="border-b-[1px] dark:border-slate-750 border-white"
      :tabs="tabs"
      :default-selected="activeTab"
      @updated="(newValue) => activeTab = newValue"
    />

    <MigrationBalances class="h-[calc(100%-39px)] overflow-y-auto scroll-style" v-show="activeTab === 'balances'" />
    <NFTs class="h-[calc(100%-39px)] overflow-y-auto" v-show="activeTab === 'nfts'" />
    <Defi class="h-[calc(100%-39px)] overflow-y-auto" v-show="activeTab === 'defi'" />
  </div>
</template>

<script setup lang="ts">
const activeTab = ref('balances');

const tabs = [
  {
    name: 'Balances',
    value: 'balances',
  },
  // TODO: hide NFTs and DeFi while it's not implemented yet
  // {
  //   name: 'NFTs',
  //   value: 'nfts',
  // },
  // {
  //   name: 'DeFi Positions',
  //   value: 'defi',
  // },
];
</script>