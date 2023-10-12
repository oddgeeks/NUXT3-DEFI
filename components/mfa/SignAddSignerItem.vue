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
const { account } = useWeb3()

const signerAdded = computed(() => isSignerAdded(selectedSafe.value!, props.address, props.chainId))

const isInstadappSigner = computed(() => isAddressEqual(props.address, instadappSigner))
const isInstadappSignerAdded = computed(() => isSignerAdded(selectedSafe.value!, instadappSigner, props.chainId))

const instadappSignerNotYetAdded = computed(() => !isInstadappSigner.value && !isInstadappSignerAdded.value)

async function handleAddSigner() {
  try {
    pending.value = true
    const threshold = '2'
    const actualSigners = [{ address: props.address, name: '' }]

    const signers = actualSigners.map(signer => signer.address)

    const metadata = threshold
      ? encodeMultipleActions(
        encodeAddSignersMetadata(signers, false),
        encodeChangeThresholdMetadata(threshold, false),
      )
      : encodeAddSignersMetadata(signers)

    const txHash = await addSignersWithThreshold({
      addresses: actualSigners,
      threshold,
      chainId: props.chainId,
    })

    if (txHash) {
      const provider = getRpcProvider(props.chainId)

      await provider.waitForTransaction(txHash)

      executed.value = true

      logActionToSlack({
        account: account.value,
        action: 'add-signers',
        txHash,
        message: generateSlackMessage(metadata, props.chainId),
        chainId: String(props.chainId),
      })
    }

    signed.value = true
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
    pending.value = false
  }
}

async function handleRemoveSigner() {
  try {
    pending.value = true

    const threshold = isInstadappSigner ? 1 : 2

    const addresses = [props.address]

    const metadata = encodeMultipleActions(
      encodeRemoveSignersMetadata(addresses, false),
      encodeChangeThresholdMetadata(threshold, false),
    )

    const txHash = await removeSignerWithThreshold({
      addresses,
      threshold,
      chainId: props.chainId,
    })

    if (txHash) {
      const provider = getRpcProvider(props.chainId)

      await provider.waitForTransaction(txHash)

      executed.value = true

      logActionToSlack({
        account: account.value,
        action: 'remove-signers',
        txHash,
        message: generateSlackMessage(metadata, props.chainId),
        chainId: String(props.chainId),
      })
    }

    signed.value = true
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
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
      {{ executed ? 'Executed' : signed ? 'Signed' : hovered ? 'Remove' : 'Enabled' }}
    </CommonButton>

    <CommonButton v-else class="h-7.5 w-20 items-center justify-center text-xs" :disabled="pending || signed || executed || signerAdded" :loading="pending" @click="handleAddSigner">
      {{ executed ? 'Executed' : signed ? 'Signed' : 'Enable' }}
    </CommonButton>
  </li>
</template>
