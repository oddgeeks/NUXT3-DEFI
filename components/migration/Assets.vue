<script setup lang="ts">
const activeTab = ref('balances')

const { selectedSafe } = storeToRefs(useSafe())
const { selectedSafeForMigration } = storeToRefs(useMigration())
const { setTokensForMigration, setNFTsForMigration, setDefiForMigration } = useMigration()

// When a new safe is selected clean up selected assets for migration
watch(selectedSafe, () => {
  setTokensForMigration([])
  setNFTsForMigration([])
  setDefiForMigration([])
  selectedSafeForMigration.value = undefined
}, {
  immediate: true,
  deep: true,
})

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
  // {
  //   name: 'DeFi',
  //   value: 'defi',
  // },
]
</script>

<template>
  <div class="overflow-y-hidden">
    <MigrationTabs
      class="border-b-[1px] border-white dark:border-slate-750"
      :tabs="tabs"
      :default-selected="activeTab"
      @updated="(newValue) => activeTab = newValue"
    />

    <MigrationBalances v-if="activeTab === 'balances'" class="scroll-style h-[calc(100%-39px)] overflow-y-auto" />
    <MigrationNFTs v-else-if="activeTab === 'nfts'" class="scroll-style h-[calc(100%-39px)] overflow-y-auto" />
    <MigrationGas v-else-if="activeTab === 'gas'" />
    <!-- <MigrationDefi v-else-if="activeTab === 'defi'" class="h-[calc(100%-39px)] overflow-y-auto scroll-style" /> -->
  </div>
</template>
