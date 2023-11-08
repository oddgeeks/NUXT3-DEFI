<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  primary?: boolean
  tooltip?: string
  detailed?: boolean
}>()

const route = useRoute()
const router = useRouter()

const { safeAddress } = useAvocadoSafe()
const { fetchPendingMultisigTxnsCount, setGasBalance } = useSafe()
const { safeTotalBalanceMapping, selectedSafe } = storeToRefs(useSafe())
const { checkSafeIsActualMultisig } = useMultisig()

const isMultisig = computed(() => checkSafeIsActualMultisig(props.safe))
const walletName = useLocalStorage(`safe-label-${props.safe?.safe_address}`, isMultisig.value ? 'MultiSig' : 'Personal')

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
      'border-slate-50 bg-slate-50 dark:bg-gray-900': active,
      'bg-slate-150 dark:bg-gray-850': !active,
      'gap-3 rounded-2xl px-4 py-[14px]': detailed,
      'items-center justify-center gap-2.5 rounded-7.5 px-[14px] py-1': !detailed,
    }"
    class="flex w-full border border-slate-50 text-left dark:border-gray-800" @click="handleClick"
  >
    <SvgoCheckCircle
      :class="{
        'success-circle': active,
        'svg-circle darker': !active,
        'h-6 w-6': detailed,
        'h-4.5 w-4.5': !detailed,
      }"
      class="shrink-0 text-gray-500"
    />
    <div
      :class="{
        'gap-2': detailed,
      }"
      class="flex flex-1 flex-col"
    >
      <div class="flex items-center justify-between">
        <div
          :class="{
            'text-sm': detailed,
            'text-xs': !detailed,
          }" class="flex items-center gap-2 font-medium"
        >
          <p :class="isMultisig ? 'text-purple' : 'text-primary'">
            {{ walletName }}
          </p>
          <template v-if="detailed">
            <button @click.stop="onEdit">
              <SvgoEdit />
            </button>
            <SafeBadge show-tooltip class="!text-[10px]" :safe="safe" />
          </template>
        </div>
        <SvgoPin class="text-gray-700" />
      </div>

      <div class="flex flex-col gap-1.5">
        <Copy
          class="w-fit"
          :class="{
            'text-sm leading-5 text-slate-900 dark:text-white': detailed,
            'text-[10px] leading-[18px] text-gray-400': !detailed,
          }" icon-only icon-class="!w-3 !h-3" :text="safe?.safe_address"
        >
          <template #content>
            {{ shortenHash(safe?.safe_address) }}
          </template>
        </Copy>

        <div v-if="detailed" class="flex items-center justify-between">
          <p class="text-sm font-medium leading-[18px] text-gray-400">
            {{ balance ? formatUsd(balance) : '' }}
          </p>
          <p v-if="isMultisig && pendingTxnsCount" class="text-xs font-medium text-orange">
            {{ `${pendingTxnsCount} Pending txns` }}
          </p>
        </div>
      </div>
    </div>
  </button>
</template>
