<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'migration',
})
</script>

<template>
  <div class="flex flex-col md:flex-row grow mt-[30px] mb-10 h-[calc(100%-58px)]">
    <MigrationLegacyWallet class="grow-0 shrink-0 basis-[420px] mr-0 md:mr-[60px]" />
    <MigrationDestination class="grow mt-[30px] md:mt-0" />
  </div>
</template>
