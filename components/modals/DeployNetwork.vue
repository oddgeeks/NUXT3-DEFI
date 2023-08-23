<script setup lang="ts">
const props = defineProps<{
  network: Network
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
  chainId: Number(props.network.chainId),
  operation: '0',
}))

const { data, pending, error } = useEstimatedFee(
  transaction,
  ref(String(props.network.chainId)),
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
      message: ` ${props.network.name}`,
      action: 'deploy',
      txHash: transactionHash,
      chainId: String(props.network.chainId),
      account: account.value,
    })

    await showPendingTransactionModal(transactionHash, props.network.chainId, 'send')

    setTimeout(() => {
      refreshNuxtData('allNetworkVersions')
    }, 5000)

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
  <div class="flex gap-7.5 flex-col">
    <ChainLogo class="w-10 h-10 mx-auto" :chain="network.chainId" />
    <div>
      <h1 class="font-lg text-center leading-5 mb-3">
        {{ network.name }}
      </h1>
      <h2 class="font-medium text-xs text-slate-400 leading-5 text-center">
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
