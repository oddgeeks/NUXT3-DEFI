<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-5 border-[1px] border-slate-750 bg-gray-850">
    <MigrationLoadingLegacyWallet v-if="!selectedSafe" />
    <WalletItem
      v-else
      class="border-0"
      :safe="selectedSafe"
      hide-active-state
      detailed
    />

    <MigrationAssets />
  </div>
</template>
