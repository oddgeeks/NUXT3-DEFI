<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-5 border-[1px] border-white bg-slate-150 dark:border-slate-750 dark:bg-gray-850">
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
