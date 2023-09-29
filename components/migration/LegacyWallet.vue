<script setup lang="ts">
const { legacySafe } = storeToRefs(useSafe());
</script>

<template>
  <div class="bg-gray-850 border-slate-750 border-[1px] rounded-5 flex flex-col overflow-hidden">
    <MigrationLoadingLegacyWallet v-if="!legacySafe" />
    <MigrationWalletItem
      v-else
      class="border-0"
      :safe="legacySafe"
      tooltip="Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever."
    />

    <MigrationAssets />
  </div>
</template>
