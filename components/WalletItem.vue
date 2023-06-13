<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
}>()

const { safeAddress } = useAvocadoSafe()
const { getBalances } = useSafe()

const balance = ref('0')
const pending = ref(false)

const active = computed(() => {
  return safeAddress.value === props.safe?.safe_address
})

async function fetchBalance() {
  try {
    pending.value = true
    const resp = await getBalances(props.safe?.safe_address)

    const balances = resp.flat()

    const totalBalance = balances?.reduce(
      (acc, curr) => acc.plus(curr.balanceInUSD || '0'),
      toBN(0) || toBN(0),
    )

    balance.value = totalBalance.toFixed()
  }
  finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchBalance()
})
</script>

<template>
  <button
    :class="{
      'dark:bg-slate-850 bg-slate-50': active,
      'dark:bg-gray-850 bg-slate-150': !active,
    }"
    class="px-4 w-full text-left flex justify-between py-3.5 border rounded-2xl border-slate-150 dark:border-slate-750" @click="safeAddress = safe.safe_address"
  >
    <div>
      <p class="leading-[10px] text-primary mb-2.5">
        Personal
      </p>
      <p class="text-sm leading-[18px] mb-[6px]">
        {{ shortenHash(safe?.safe_address) }}
      </p>

      <div
        v-if="pending "
        style="width: 80px; height: 18px"
        class="rounded-lg loading-box"
      />

      <p v-else class="text-slate-400 leading-[18px] text-sm">
        {{ formatUsd(balance) }}
      </p>
    </div>
    <div>
      <SvgoCheckCircle
        :class="{
          'success-circle': active,
          'svg-circle darker': !active,
        }"
        class="h-6 w-6"
      />
    </div>
  </button>
</template>
