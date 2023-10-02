<script setup lang="ts">
const { legacySafe } = storeToRefs(useSafe())
</script>

<template>
  <div class="dark:bg-gray-850 bg-slate-150 dark:border-slate-750 border-white border-[1px] rounded-5 flex flex-col overflow-hidden">
    <MigrationLoadingLegacyWallet v-if="!legacySafe" />
    <WalletItem
      v-else
      class="border-0"
      :safe="legacySafe"
      hide-active-state
      tooltip="Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever."
    />

    <MigrationAssets />
  </div>
</template>
