<script lang="ts" setup>
const props = defineProps<{
  chainId: string | number
  address: string
}>()

defineEmits(['destroy'])

const pending = ref(false)
const signed = ref(false)
const executed = ref(false)
const [hovered, toggle] = useToggle(false)

const { addSignersWithThreshold, removeSignerWithThreshold } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { selectedSafe } = storeToRefs(useSafe())
const { fetchSafeInstanceses } = useSafe()
const { backupSigner } = useMfa()
const { $t } = useNuxtApp()

const signerAdded = computed(() => isSignerAdded(selectedSafe.value!, props.address, props.chainId))

const isInstadappSigner = computed(() => isAddressEqual(props.address, instadappSigner))
const isInstadappSignerAdded = computed(() => isSignerAdded(selectedSafe.value!, instadappSigner, props.chainId))

const isBackupSignerAvailable = computed(() => {
  if (!backupSigner.value)
    return false

  return backupSigner.value.chainIds.some(i => String(i) === String(props.chainId))
})

const isBackupSignerAvailableOnChain = computed(() => isInstadappSigner.value && isBackupSignerAvailable.value)

const addSignerActions = asyncComputed(async () => {
  return addSignersWithThreshold({
    addresses: [{ address: props.address, name: '' }],
    threshold: '2',
    chainId: props.chainId,
    actionsOnly: true,
  })
})

const removeSignerActions = asyncComputed(async () => {
  const threshold = isInstadappSigner.value ? 1 : 2

  const addresses = [props.address]

  if (isBackupSignerAvailableOnChain.value)
    addresses.push(backupSigner.value.address)

  return removeSignerWithThreshold({
    addresses,
    threshold,
    chainId: props.chainId,
    actionsOnly: true,
  })
})

const instadappSignerNotYetAdded = computed(() => !isInstadappSigner.value && !isInstadappSignerAdded.value)

async function handleAddSigner() {
  try {
    pending.value = true

    const { success } = await openReviewSignerProcessModal({
      chainId: props.chainId,
      actions: addSignerActions.value,
      deleteSigner: false,
      isInstadappSigner: isInstadappSigner.value,
    })

    if (!success) {
      pending.value = false
      return
    }

    setTimeout(async () => {
      await fetchSafeInstanceses()
      pending.value = false

      const chainName = chainIdToName(props.chainId)

      const messageKey = isInstadappSigner.value ? 'mfa.notifications.instadappSignerEnabled' : 'mfa.notifications.signerEnabled'

      openSnackbar({
        message: $t(messageKey, { chainName }),
        type: 'success',
      })
    }, 5000)
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
    pending.value = false
  }
}

async function handleRemoveSigner() {
  try {
    pending.value = true

    const { success } = await openReviewSignerProcessModal({
      chainId: props.chainId,
      actions: removeSignerActions.value,
      deleteSigner: true,
      isInstadappSigner: isInstadappSigner.value,
      removeBackupSigner: isBackupSignerAvailableOnChain.value,
    })

    if (!success) {
      pending.value = false
      return
    }

    setTimeout(async () => {
      await fetchSafeInstanceses()
      pending.value = false
      const chainName = chainIdToName(props.chainId)

      const messageKey = isInstadappSigner.value ? 'mfa.notifications.instadappSignerDisabled' : 'mfa.notifications.signerDisabled'

      openSnackbar({
        message: $t(messageKey, { chainName }),
        type: 'success',
      })
    }, 1000)
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })

    pending.value = false
  }
}
</script>

<template>
  <li v-if="!instadappSignerNotYetAdded" class="flex w-full items-center justify-between">
    <span class="flex items-center gap-3 text-sm leading-5">
      <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
      {{ chainIdToName(chainId) }}
    </span>

    <CommonButton v-if="signerAdded" class="h-7.5 w-20 items-center justify-center text-xs" :color="hovered ? 'red' : 'white'" :disabled="pending || signed || executed" :loading="pending" @mouseenter="toggle(true)" @mouseleave="toggle(false)" @click="handleRemoveSigner">
      {{ executed ? 'Executed' : signed ? 'Signed' : hovered ? 'Disable' : 'Enabled' }}
    </CommonButton>

    <CommonButton v-else class="h-7.5 w-20 items-center justify-center text-xs" :disabled="pending || signed || executed || signerAdded" :loading="pending" @click="handleAddSigner">
      {{ executed ? 'Executed' : signed ? 'Signed' : 'Enable' }}
    </CommonButton>
  </li>
</template>
