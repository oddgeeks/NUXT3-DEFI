<script setup lang="ts">
const { allSafes } = storeToRefs(useSafe())

const sourceSafe = useState('migration-source-safe', () => '')

const filteredSafes = computed(() => {
  const safes = allSafes.value.filter(safe => safe.multisig === 1)
  if (!sourceSafe.value)
    return safes
  return safes.filter(safe => safe.safe_address !== sourceSafe.value)
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
