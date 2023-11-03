<script setup lang="ts">
const props = defineProps<{
  option: ISafeOptions
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, sendTransaction } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

const submitting = ref(false)

const transaction = computed(() => ({
  to: safeAddress.value,
  data: '0x',
  value: '0',
  chainId: Number(props.option.chainId),
  operation: '0',
}))

const { data, pending, error } = useEstimatedFee(
  transaction,
  ref(String(props.option.chainId)),
  {
    immediate: true,
  },
)

async function handleDeploy() {
  try {
    submitting.value = true

    const metadata = encodeDeployMetadata()

    const transactionHash = await sendTransaction(transaction.value, {
      metadata,
    }, 'deploy')

    if (!transactionHash)
      return

    logActionToSlack({
      message: generateSlackMessage(metadata, props.option.chainId),
      action: 'deploy',
      txHash: transactionHash,
      chainId: String(props.option.chainId),
      account: account.value,
    })

    await showPendingTransactionModal(transactionHash, props.option.chainId, 'deploy')

    emit('destroy')
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'deploy',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <ChainLogo class="mx-auto h-10 w-10" :chain="option.chainId" />
    <div>
      <h1 class="font-lg mb-3 text-center leading-5">
        {{ chainIdToName(option.chainId) }}
      </h1>
      <h2 class="text-center text-xs font-medium leading-5 text-gray-400">
        In order to interact with dapps on your requested network, please deploy
        (activate) your wallet.
      </h2>
    </div>
    <EstimatedFee :data="data" :loading="pending" :error="error" />
    <CommonButton
      size="lg"
      class="w-full justify-center"
      :loading="submitting"
      :disabled="pending || error || submitting"
      @click="handleDeploy"
    >
      Deploy
    </CommonButton>
  </div>
</template>
