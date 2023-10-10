<script lang="ts" setup>
const props = defineProps<{
  chainId: string | number
  address: string
  removeSigner?: boolean
}>()

defineEmits(['destroy'])

const pending = ref(false)
const signed = useState(`mfa-signed-${props.chainId}-${props.address}-${props.removeSigner}`, () => false)
const executed = useState(`mfa-executed-${props.chainId}-${props.address}-${props.removeSigner}`, () => false)

const { isSignerAdded } = useMultisig()

const { addSignersWithThreshold, removeSignerWithThreshold } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

const signerAdded = computed(() => isSignerAdded(props.address, props.chainId))

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
    const threshold = 2

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
  <li class="flex w-full items-center justify-between">
    <span class="flex items-center gap-3 text-sm leading-5">
      <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
      {{ chainIdToName(chainId) }}
    </span>

    <CommonButton v-if="removeSigner && signerAdded" color="red" :disabled="pending || signed || executed" :loading="pending" @click="handleRemoveSigner">
      {{ executed ? 'Executed' : signed ? 'Signed' : 'Remove' }}
    </CommonButton>

    <CommonButton v-else :disabled="pending || signed || executed || signerAdded" :loading="pending" @click="handleAddSigner">
      {{ signerAdded ? 'Added' : executed ? 'Executed' : signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </li>
</template>
