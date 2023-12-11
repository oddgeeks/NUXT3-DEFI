<script setup lang="ts">
const props = defineProps<{
  chainId: string | number
  isInstadappSigner?: boolean
  deleteSigner?: boolean
  removeBackupSigner?: boolean
  actions: {
    actions: TransactionsAction[]
    metadata: string
  }
}>()

const emit = defineEmits(['resolve'])
const { sendTransactions } = useAvocadoSafe()
const { account } = useWeb3()

const transaction = computed(() => props.actions.actions)
const submitting = ref(false)
const { parseTransactionError } = useErrorHandler()

const { data, pending, error } = useEstimatedFee(
  transaction,
  ref(String(props.chainId)),
  {
    immediate: true,
  },
)

const label = computed(() => props.deleteSigner ? 'disable' : 'enable')
const signerTypeLabel = computed(() => props.isInstadappSigner ? 'OTP authentication' : 'backup signer')

async function handleSubmit() {
  try {
    submitting.value = true
    const metadata = props.actions.metadata
    const action = props.deleteSigner ? 'remove-signers' : 'add-signers'

    const txHash = await sendTransactions(transaction.value, props.chainId, {
      metadata,
    }, action)

    if (txHash) {
      const provider = getRpcProvider(props.chainId)

      await provider.waitForTransaction(txHash)

      logActionToSlack({
        account: account.value,
        message: generateSlackMessage(metadata, props.chainId),
        chainId: String(props.chainId),
        action,
        txHash,
      })

      emit('resolve', true, { txHash })
    }
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <ChainLogo class="mx-auto h-10 w-10" :chain="chainId" />
    <div>
      <h1 class="font-lg mb-3 text-center leading-5">
        {{ chainIdToName(chainId) }}
      </h1>
      <h2 class="text-center text-xs font-medium leading-5 text-gray-400">
        Confirming this will {{ label }} {{ signerTypeLabel }}
        <span v-if="removeBackupSigner">and backup signer will be removed</span> on {{ chainIdToName(chainId) }}
      </h2>
    </div>
    <EstimatedFee :data="data" :loading="pending" :error="error" />
    <CommonButton
      size="lg"
      :color="deleteSigner ? 'red' : 'primary'"
      class="w-full justify-center capitalize"
      :loading="submitting"
      :disabled="pending || error || submitting"
      @click="handleSubmit"
    >
      {{ label }}
    </CommonButton>
  </div>
</template>
