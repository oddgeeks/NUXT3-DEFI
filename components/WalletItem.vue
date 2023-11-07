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
      'border-slate-50 bg-slate-50 dark:border-gray-800 dark:bg-gray-900': active,
      'bg-slate-150 dark:bg-gray-850': !active,
    }"
    class="flex w-full items-center justify-center gap-2.5 rounded-7.5 border border-slate-150 px-[14px] py-1 text-left dark:border-slate-750" @click="handleClick"
  >
    <SvgoCheckCircle
      :class="active ? 'success-circle' : 'svg-circle darker'"
      class="h-4.5 w-4.5 shrink-0 text-gray-500"
    />
    <div class="flex flex-col">
      <div class="flex items-center gap-[8px] text-xs font-medium">
        <p v-if="isMultisig" class="text-purple">
          {{ walletName }}
        </p>
        <p v-else class="text-primary">
          {{ walletName }}
        </p>
        <!--
        <button @click.stop="onEdit">
          <SvgoEdit />
        </button> -->
      </div>

      <Copy icon-only icon-class="!w-3 !h-3" class="text-[10px] leading-[18px] text-gray-400" :text="safe?.safe_address">
        <template #content>
          {{ shortenHash(safe?.safe_address) }}
        </template>
      </Copy>

      <!-- <p class="text-sm font-medium leading-[18px] text-gray-400">
        {{ balance ? formatUsd(balance) : '' }}
      </p> -->
    </div>
    <!-- <div class="flex flex-col items-end justify-between">
      <div class="flex items-center gap-2">
        <SvgoInfo2 v-if="tooltip && isLegacySafeExist" v-tippy="tooltip" class="text-gray-500" />
        <SafeBadge :safe="safe" />
      </div>
      <p class="text-xs font-medium text-orange">
        {{ isMultisig && pendingTxnsCount ? `${pendingTxnsCount} Pending txns` : '' }}
      </p>
    </div> -->
  </button>
</template>
