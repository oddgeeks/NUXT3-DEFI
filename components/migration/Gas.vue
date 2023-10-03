<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
const { avoProvider } = useSafe()
const { selectedSafeForMigration } = storeToRefs(useMigration())
const gasBalance = ref<string>()

const pending = ref(false)

async function fetchGasBalances() {
  selectedSafeForMigration.value = undefined
  try {
    pending.value = true
    const balance = await avoProvider.send('api_getWithdrawableBalance', [
      selectedSafe.value?.safe_address,
      'success',
    ])

    gasBalance.value = balance
  }
  finally {
    pending.value = false
  }
}

watchThrottled(selectedSafe, fetchGasBalances, {
  throttle: 1000,
  immediate: true,
  deep: true,
})
</script>

<template>
  <div>
    <div class="flex flex-col items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white">
      <div class="w-full">
        <MigrationGasCard :pending="pending || !selectedSafe || !gasBalance" :safe="selectedSafe!" :balance="gasBalance!" />
      </div>
    </div>
  </div>
</template>
