<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  detailed?: boolean
  hideActiveState?: boolean
}>()

const route = useRoute()
const router = useRouter()

const { safeAddress } = useAvocadoSafe()
const { fetchPendingMultisigTxnsCount, setGasBalance } = useSafe()
const { safeTotalBalanceMapping, selectedSafe } = storeToRefs(useSafe())
const { checkSafeIsActualMultisig } = useMultisig()
const { togglePinSafe, isSafePinned, pinnedSafes } = useAccountState()
const { instadappSigner } = storeToRefs(useEnvironmentState())
const { getFallbackLabel, safeLabelStorageKey } = useSafeUtils()

const isMultisig = computed(() => checkSafeIsActualMultisig(props.safe))
const isProtected = computed(() => checkSafeProtected(props.safe, instadappSigner.value))
const isLegacy = computed(() => props.safe?.multisig === 0)
const balance = computed(() => safeTotalBalanceMapping.value[props.safe?.safe_address])
const safePinned = computed(() => isSafePinned(props.safe.safe_address))

const walletStorageName = useLocalStorage(`${safeLabelStorageKey}-${props.safe?.safe_address}`, null)

const walletName = computed(() => walletStorageName.value || getFallbackLabel(props.safe))

const baseColorClass = computed(() => isMultisig.value ? 'text-purple' : isLegacy.value ? 'text-gray-400' : 'text-primary')

const isSafeSecondary = computed(() => !isAddressEqual(props.safe.owner_address, selectedSafe.value?.owner_address))

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
  if (props.hideActiveState)
    return

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
  <div>
    <button
      :class="[
        {
          'bg-gray-900': active,
          'bg-gray-850': !active,
          'gap-3 rounded-2xl px-4 py-[14px]': detailed,
          'items-center justify-center gap-1.5 rounded-7.5 px-2.5 py-1.5 sm:gap-2.5 sm:px-[14px] sm:py-1': !detailed,
        },
        $attrs?.class,
      ]"
      class="flex h-full w-full border border-gray-800 text-left hover:bg-gray-900" @click="handleClick"
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
            <p class="inline-flex items-center gap-1" :class="baseColorClass">
              <template v-if="!detailed">
                <SvgoDoubleUser v-if="isMultisig" />
                <SvgoSingleUser v-else />
              </template>
              <span class="truncate" :class="!detailed ? 'sm:w-[65px]' : 'max-w-[140px]'">
                {{ walletName }}
              </span>
            </p>
            <span
              v-if="props.safe.multisig && !isSafeSecondary" :class="{
                'px-[5px] py-0.5 text-[10px]/[16px]': detailed,
                'px-1 text-[8px]/[14px]': !detailed,
              }" class="inline-flex items-center justify-center rounded-lg bg-gray-700"
            >
              #{{ props.safe.multisig_index }}
            </span>
            <template v-if="detailed">
              <button @click.stop="onEdit">
                <SvgoEdit />
              </button>
              <SafeBadge show-tooltip class="!text-[10px]" :safe="safe" />
            </template>
            <SvgoShieldChecked
              v-if="isProtected" v-tippy="'This account has Avocado Protect activated on 1 or more networks.'"
              :class="!detailed ? 'h-4 w-4' : ''"
              class="text-primary"
            />
          </div>
          <button v-if="detailed" :disabled="pinnedSafes.length > 2 && !safePinned" @click.stop="togglePinSafe(safe.safe_address)">
            <SvgoPin :class="safePinned ? 'text-primary [&>path]:fill-primary' : 'text-gray-700'" />
          </button>
        </div>

        <div class="flex flex-col gap-1.5">
          <div class="flex items-center gap-1.5">
            <span
              :class="{
                'text-sm leading-5 text-white': detailed,
                'text-[10px] leading-[18px] text-gray-400': !detailed,
              }"
            >
              {{ shortenHash(safe?.safe_address) }}
            </span>
            <Copy
              class="w-fit"
              icon-only
              icon-class="!w-3 !h-3" :text="safe?.safe_address"
            />
          </div>

          <div v-if="detailed" class="flex items-center justify-between">
            <p v-if="balance" class="text-sm font-medium leading-[18px] text-gray-400">
              {{ formatUsd(balance) }}
            </p>
            <p v-if="isMultisig && pendingTxnsCount" class="text-xs font-medium text-orange">
              {{ `${pendingTxnsCount} Pending txns` }}
            </p>
          </div>
        </div>
      </div>
    </button>
  </div>
</template>
