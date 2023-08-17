<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  primary?: boolean
}>()

const route = useRoute()
const router = useRouter()

const { safeAddress } = useAvocadoSafe()
const { fetchPendingMultisigTxnsCount } = useSafe()
const { safeTotalBalanceMapping } = storeToRefs(useSafe())
const walletName = useLocalStorage(`safe-${props.safe?.safe_address}`, props.safe.multisig ? 'Multisig' : 'Personal')

const balance = computed(() => safeTotalBalanceMapping.value[props.safe?.safe_address])

const val = walletName.value?.trim()
if (!val)
  walletName.value = 'Personal'

const active = computed(() => {
  return safeAddress.value === props.safe?.safe_address
})

const { data: pendingTxnsCount } = useAsyncData(`safe-pending-multisig-txns-${props.safe.safe_address}`, async () => {
  if (props.safe.multisig === 1) {
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
    if (props.safe.multisig === 1) {
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
        <p v-if="safe.multisig" class="leading-[10px] text-purple text-sm font-medium">
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
      <p
        :class="safe.multisig ? 'bg-purple text-purple' : 'bg-primary text-primary'"
        class="rounded-lg bg-opacity-[14%] text-xs py-0.5 px-2 font-medium"
      >
        {{ safe.multisig ? 'MULTISIG' : 'PERSONAL' }}
      </p>
      <p class="text-orange text-xs font-medium">
        {{ safe.multisig === 1 && pendingTxnsCount ? `${pendingTxnsCount} Pending txns` : '' }}
      </p>
    </div>
  </button>
</template>
