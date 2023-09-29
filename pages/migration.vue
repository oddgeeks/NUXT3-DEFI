<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'migration',
})

useEagerConnect()
</script>

<template>
  <div class="flex flex-col md:flex-row grow mt-[102px] sm:mt-[30px] overflow-y-auto sm:overflow-y-hidden pb-6 md:pb-0">
    <MigrationLegacyWallet class="grow-0 shrink-0 basis-[420px] mr-0 md:mr-[60px]" />
    <MigrationDestination class="grow mt-[30px] md:mt-0" />
  </div>
</template>
