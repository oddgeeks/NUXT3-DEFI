<script setup lang="ts">
const { allSafes, selectedSafe } = storeToRefs(useSafe())

const filteredSafes = computed(() => {
  if (!selectedSafe.value)
    return []

  return allSafes.value.filter(safe =>
    safe.multisig === 1
    && !isAddressEqual(safe.safe_address, selectedSafe.value?.safe_address))
})

function handleSelect(safe: ISafe) {
  openMigrationModal(safe)
}
</script>

<template>
  <div>
    <h2 class="mb-5 text-base font-semibold text-white">
      Migrate to
    </h2>

    <div class="flex flex-col gap-5">
      <WalletItem
        v-for="safe in filteredSafes"
        :key="safe.id"
        :safe="safe"
        hide-active-state
        detailed
        @click="handleSelect(safe)"
      />
    </div>
  </div>
</template>
