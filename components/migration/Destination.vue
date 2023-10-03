<script setup lang="ts">
const { allSafes } = storeToRefs(useSafe())
const { selectedSafeForMigration } = storeToRefs(useMigration())

const filteredSafes = computed(() => {
  const safes = allSafes.value.filter(safe => safe.multisig === 1)
  if (!selectedSafeForMigration.value)
    return safes
  return safes.filter(safe => safe.safe_address !== selectedSafeForMigration.value?.safe.safe_address)
})

function handleSelect(safe: ISafe) {
  openMigrationModal(safe)
}
</script>

<template>
  <div>
    <h2 class="text-white text-base font-semibold mb-5">
      Migrate to
    </h2>

    <div class="flex flex-col gap-5">
      <WalletItem
        v-for="safe in filteredSafes"
        :key="safe.id"
        :safe="safe"
        v2
        primary
        hide-active-state
        @click="handleSelect(safe)"
      />
    </div>
  </div>
</template>
