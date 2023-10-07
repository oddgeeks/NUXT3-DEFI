<script lang="ts" setup>
const props = defineProps<{
  chainId: string | number
  modelValue: boolean[]

}>()

const emit = defineEmits(['destroy', 'update:modelValue'])

const pending = ref(false)
const signed = useState(`signed-${props.chainId}`, () => false)
const executed = useState(`executed-${props.chainId}`, () => false)

const { isInstadappSignerAdded } = useMultisig()

const { addSignersWithThreshold } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

const instadappSignerAdded = computed(() => isInstadappSignerAdded(props.chainId))

async function handleSign() {
  try {
    pending.value = true
    const threshold = '2'
    const actualSigners = [{ address: instadappSigner, name: '' }]

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

    const modelValue = props.modelValue
    modelValue.push(true)
    emit('update:modelValue', modelValue)
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
    <CommonButton :disabled="pending || signed || executed || instadappSignerAdded" :loading="pending" @click="handleSign">
      {{ instadappSignerAdded ? 'Added' : executed ? 'Executed' : signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </li>
</template>
