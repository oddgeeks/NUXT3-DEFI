<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useEagerConnect()
</script>

<template>
  <div class="flex h-full flex-1">
    <MigrationLegacyWallet class="mr-0 shrink-0 grow-0 basis-[420px] md:mr-[60px]" />
    <MigrationDestination class="mt-[30px] grow md:mt-0" />
  </div>
</template>
