<script setup lang="ts">
import EditSVG from '@/assets/images/icons/edit.svg?component'

const props = defineProps<{
  safe: ISafe
}>()

const { safeAddress } = useAvocadoSafe()
const { getBalances } = useSafe()
const walletName = useLocalStorage(`safe-${props.safe?.safe_address}`, 'Personal')

const val = walletName.value?.trim()
if (!val)
  walletName.value = 'Personal'

const active = computed(() => {
  return safeAddress.value === props.safe?.safe_address
})

const { data: balance, pending } = useAsyncData(`safe-balance-${props.safe.safe_address}`, async () => {
  const resp = await getBalances(props.safe?.safe_address)

  const balances = resp.flat()

  const balance = balances?.reduce(
    (acc, curr) => acc.plus(curr.balanceInUSD || '0'),
    toBN(0) || toBN(0),
  )

  return balance.toFixed()
})

async function onEdit() {
  openWalletNameEditModal(props.safe)
}
</script>

<template>
  <button
    :class="{
      'dark:bg-slate-850 bg-slate-50': active,
      'dark:bg-gray-850 bg-slate-150': !active,
    }"
    class="px-4 w-full text-left items-stretch flex justify-between py-3.5 border rounded-2xl border-slate-150 dark:border-slate-750" @click="safeAddress = safe.safe_address"
  >
    <div>
      <dv class="flex flex-row gap-[8px] items-center mb-2.5">
        <p class="leading-[10px] text-primary">
          {{ walletName }}
        </p>
        <button @click="onEdit">
          <EditSVG />
        </button>
      </dv>

      <Copy class="text-sm leading-[18px] mb-[6px]" :text="safe?.safe_address">
        <template #content>
          {{ shortenHash(safe?.safe_address) }}
        </template>
      </Copy>

      <div
        v-if="!balance && pending"
        style="width: 80px; height: 18px"
        class="rounded-lg loading-box"
      />

      <p v-else class="text-slate-400 leading-[18px] text-sm">
        {{ formatUsd(balance) }}
      </p>
    </div>
    <div class="flex flex-col justify-between items-end">
      <SvgoCheckCircle
        :class="{
          'success-circle': active,
          'svg-circle darker': !active,
        }"
        class="h-6 w-6"
      />
      <p class="rounded-full bg-opacity-[14%] bg-primary text-primary text-[12px] py-[2px] px-[8px]">
        Personal
      </p>
    </div>
  </button>
</template>
