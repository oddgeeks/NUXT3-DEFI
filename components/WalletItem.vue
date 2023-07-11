<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  primary?: boolean
}>()

const { safeAddress } = useAvocadoSafe()
const { getBalances } = useSafe()
const walletName = useLocalStorage(`safe-${props.safe?.safe_address}`, props.safe.multisig ? 'Multisig' : 'Personal')

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
      <div class="flex items-center gap-[8px] mb-2.5">
        <p v-if="safe.multisig" class="leading-[10px] text-purple text-sm">
          {{ walletName }}
        </p>
        <p v-else class="leading-[10px] text-primary text-sm">
          {{ walletName }}
        </p>

        <button @click.stop="onEdit">
          <SvgoEdit />
        </button>
      </div>

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
      <p :class="safe.multisig ? 'bg-purple text-purple' : 'bg-primary text-primary'" class="rounded-full bg-opacity-[14%] text-xs py-0.5 px-2">
        {{ safe.multisig ? 'Multisig' : 'Personal' }}
      </p>
    </div>
  </button>
</template>
