<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div class="dark:bg-gray-850 bg-slate-150 dark:border-slate-750 border-white border-[1px] rounded-5 flex flex-col overflow-hidden">
    <MigrationLoadingLegacyWallet v-if="!selectedSafe" />
    <WalletItem
      v-else
      :v2="selectedSafe.multisig === 1"
      class="border-0"
      :safe="selectedSafe"
      hide-active-state
    />

    <MigrationAssets />
  </div>
</template>
