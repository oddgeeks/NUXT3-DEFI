<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  primary?: boolean
  tooltip?: string
}>()

const route = useRoute()
const router = useRouter()

const { safeAddress } = useAvocadoSafe()
const { fetchPendingMultisigTxnsCount, setGasBalance } = useSafe()
const { safeTotalBalanceMapping, legacySafeAddress, selectedSafe } = storeToRefs(useSafe())
const { checkSafeIsActualMultisig } = useMultisig()

const isMultisig = computed(() => checkSafeIsActualMultisig(props.safe))
const walletName = useLocalStorage(`safe-label-${props.safe?.safe_address}`, isMultisig.value ? 'MultiSig' : 'Personal')

const isLegacySafeExist = computed(() => !!legacySafeAddress.value)

const balance = computed(() => safeTotalBalanceMapping.value[props.safe?.safe_address])

const active = computed(() => {
  return safeAddress.value === props.safe?.safe_address
})

const { data: pendingTxnsCount } = useAsyncData(`safe-pending-multisig-txns-${props.safe.safe_address}`, async () => {
  if (isMultisig.value) {
    const pendingTxs = await fetchPendingMultisigTxnsCount(props.safe?.safe_address)
    return pendingTxs
  }
})

async function onEdit() {
  openWalletNameEditModal(props.safe)
}

function handleClick() {
  const safe = route.params?.safe as string

  if (safe) {
    if (isMultisig.value) {
      router.replace({
        params: {
          safe: props.safe.safe_address,
        },
      })
    }
    else {
      router.push('/')
    }
  }

  selectedSafe.value = props.safe
  safeAddress.value = props.safe.safe_address
  setGasBalance()
}
</script>

<template>
  <button
    :class="{
      'border-slate-50 bg-slate-50 dark:border-slate-800 dark:bg-slate-800': active,
      'bg-slate-150 dark:bg-gray-850': !active,
    }"
    class="flex w-full items-stretch justify-between rounded-2xl border border-slate-150 px-4 py-3.5 text-left dark:border-slate-750" @click="handleClick"
  >
    <div>
      <div class="mb-2.5 flex items-center gap-[8px]">
        <p v-if="isMultisig" class="text-sm font-medium leading-[10px] text-purple">
          {{ walletName }}
        </p>
        <p v-else class="text-sm font-medium leading-[10px] text-primary">
          {{ walletName }}
        </p>

        <button @click.stop="onEdit">
          <SvgoEdit />
        </button>
      </div>

      <Copy class="mb-[6px] text-sm leading-[18px] text-slate-900 dark:text-white" :text="safe?.safe_address">
        <template #content>
          {{ shortenHash(safe?.safe_address) }}
        </template>
      </Copy>

      <p class="text-sm font-medium leading-[18px] text-slate-400">
        {{ balance ? formatUsd(balance) : '' }}
      </p>
    </div>
    <div class="flex flex-col items-end justify-between">
      <div class="flex items-center gap-2">
        <SvgoInfo2 v-if="tooltip && isLegacySafeExist" v-tippy="tooltip" class="text-slate-500" />
        <SafeBadge :safe="safe" />
      </div>
      <p class="text-xs font-medium text-orange">
        {{ isMultisig && pendingTxnsCount ? `${pendingTxnsCount} Pending txns` : '' }}
      </p>
    </div>
  </button>
</template>
