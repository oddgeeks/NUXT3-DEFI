<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  primary?: boolean
  tooltip?: string
  v2?: boolean
}>()

const route = useRoute()
const router = useRouter()

const { safeAddress } = useAvocadoSafe()
const { fetchPendingMultisigTxnsCount, setGasBalance } = useSafe()
const { safeTotalBalanceMapping, legacySafeAddress } = storeToRefs(useSafe())
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

  safeAddress.value = props.safe.safe_address
  setGasBalance()
}
</script>

<template>
  <button
    :class="{
      'dark:bg-slate-800 dark:border-slate-800 bg-slate-50 border-slate-50': active,
      'dark:bg-gray-850 bg-slate-150': !active,
    }"
    class="px-4 w-full text-left items-stretch flex justify-between py-3.5 border rounded-2xl border-slate-150 dark:border-slate-750" @click="handleClick"
  >
    <div>
      <div class="flex items-center gap-[8px] mb-2.5">
        <p v-if="isMultisig" class="leading-[10px] text-purple text-sm font-medium">
          {{ walletName }}
        </p>
        <p v-else class="leading-[10px] text-primary text-sm font-medium">
          {{ walletName }}
        </p>

        <button @click.stop="onEdit">
          <SvgoEdit />
        </button>
      </div>

      <Copy class="text-sm leading-[18px] mb-[6px] dark:text-white text-slate-900" :text="safe?.safe_address">
        <template #content>
          {{ shortenHash(safe?.safe_address) }}
        </template>
      </Copy>

      <p class="text-slate-400 leading-[18px] text-sm font-medium">
        {{ balance ? formatUsd(balance) : '' }}
      </p>
    </div>
    <div class="flex flex-col justify-between items-end">
      <div class="flex items-center gap-2">
        <SvgoInfo2 v-if="tooltip && isLegacySafeExist" v-tippy="tooltip" class="text-slate-500" />
        <p
          :class="isMultisig ? 'bg-purple text-purple' : !v2 ? 'bg-slate-400 text-slate-400' : 'bg-primary text-primary'"
          class="rounded-lg bg-opacity-[14%] text-xs py-0.5 px-2 font-medium"
        >
          {{ isMultisig ? 'TEAM' : v2 ? 'PERSONAL' : "LEGACY" }}
        </p>
      </div>
      <p class="text-orange text-xs font-medium">
        {{ isMultisig && pendingTxnsCount ? `${pendingTxnsCount} Pending txns` : '' }}
      </p>
    </div>
  </button>
</template>
