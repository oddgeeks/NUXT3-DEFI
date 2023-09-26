<script setup lang="ts">
const { legacySafe } = storeToRefs(useSafe());
</script>

<template>
  <div class="bg-gray-850 border-slate-750 rounded-5 flex flex-col">
    <MigrationWalletItem
      class="border-0"
      v-if="legacySafe"
      :safe="legacySafe"
      tooltip="Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever."
    />

    <MigrationAssets />
  </div>
</template>
