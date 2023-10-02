<script setup lang="ts">
const { allSafes } = storeToRefs(useSafe())
const { avoProvider } = useSafe()
const gasBalances = ref<string[]>([])

const pending = ref(false)

async function fetchGasBalances() {
  try {
    pending.value = true
    const balances = await Promise.all(allSafes.value.map(i => avoProvider.send('api_getWithdrawableBalance', [
      i.safe_address,
      'success',
    ])))

    gasBalances.value = balances
  }
  finally {
    pending.value = false
  }
}

watchThrottled(allSafes, fetchGasBalances, {
  throttle: 1000,
  immediate: true,
})
</script>

<template>
  <div>
    <div class="flex flex-col items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white">
      <div class="p-5 flex items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white w-full">
        <p class="dark:text-white text-slate-900">
          Select tokens for migration
        </p>
        <button class="text-green-500">
          Select All
        </button>
      </div>
      <div class="w-full">
        <ul>
          <template v-for="safe, i in allSafes" :key="safe.id">
            <MigrationGasCard :pending="pending" :safe="safe" :balance="gasBalances[i]" />
          </template>
        </ul>
      </div>
    </div>
  </div>
</template>
