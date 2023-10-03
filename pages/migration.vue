<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'migration',
})

useEagerConnect()
</script>

<template>
  <div class="flex flex-1 h-full max-h-[calc(100vh-222px)]">
    <MigrationLegacyWallet class="grow-0 shrink-0 basis-[420px] mr-0 md:mr-[60px]" />
    <MigrationDestination class="grow mt-[30px] md:mt-0" />
  </div>
</template>
