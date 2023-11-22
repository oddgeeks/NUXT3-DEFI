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
    const balance = await avoProvider.send('api_getTransferableBalance', [
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
  <div class="flex flex-col">
    <div class="flex flex-col items-center justify-between border-b-[1px] border-white text-xs font-medium dark:border-slate-750">
      <div class="w-full">
        <MigrationGasCard :pending="pending || !selectedSafe || !gasBalance" :safe="selectedSafe!" :balance="gasBalance!" />
      </div>
    </div>
    <div class="p-5 text-xs font-medium text-orange-400">
      The transferable gas balance shown excludes promotional credits.
      If you added funds on top of promotional balances, this may effect
      your transferable amount. <NuxtLink external class="text-primary" to="https://guides.avocado.instadapp.io/migration" target="_blank">
        Learn More
      </NuxtLink>
    </div>
  </div>
</template>
