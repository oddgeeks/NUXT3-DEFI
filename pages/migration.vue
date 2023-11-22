<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useEagerConnect()
</script>

<template>
  <div class="flex h-full flex-1 flex-col gap-7.5 sm:flex-row sm:gap-[60px]">
    <MigrationLegacyWallet class="shrink-0 grow-0 sm:basis-[420px]" />
    <MigrationDestination class="grow" />
  </div>
</template>
