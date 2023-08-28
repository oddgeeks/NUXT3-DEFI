<script setup lang="ts">
const emit = defineEmits(['destroy'])

const { account } = useWeb3()
const { sendTransaction } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()

const loading = ref(false)

const to = ref('')
const value = ref('0')
const operation = ref('0')
const id = ref('0')
const data = ref('0x')
const chainId = ref('137')

const sendingDisabled = computed(
  () => loading.value || !data.value || !to.value,
)

async function onSubmit() {
  loading.value = false

  if (sendingDisabled.value)
    return

  loading.value = true
  try {
    const transactionHash = await sendTransaction(
      {
        to: to.value,
        data: data.value,
        value: value.value,
        chainId: Number(chainId.value),
        operation: operation.value,
      },
      {
        id: id.value,
      },
      'others',
    )

    if (!transactionHash)
      return

    emit('destroy')

    showPendingTransactionModal(transactionHash, chainId.value, 'send')
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'send',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
    })
  }

  loading.value = false
}
</script>

<template>
  <form class="text-center flex gap-7.5 flex-col" @submit.prevent="onSubmit">
    <div class="flex justify-center flex-col items-center">
      <div class="flex flex-col gap-[14px]">
        <h2 class="text-lg leading-5 text-center">
          Custom Transaction
        </h2>
      </div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Network</span>
        </div>

        <CommonSelect
          v-model="chainId"
          value-key="chainId"
          label-key="name"
          :options="availableNetworks"
        >
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">To</span>
        </div>

        <CommonInput v-model="to" name="to" placeholder="Enter to" />
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Value</span>
        </div>
        <CommonInput
          v-model="value"
          type="numeric"
          name="value"
          placeholder="Enter value"
        />
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Operation</span>
        </div>
        <CommonInput
          v-model="operation"
          type="numeric"
          name="operation"
          placeholder="Enter operation"
        />
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">ID</span>
        </div>
        <CommonInput
          v-model="id"
          type="numeric"
          name="id"
          placeholder="Enter id"
        />
      </div>

      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span class="text-sm">Data</span>
        </div>

        <CommonInput v-model="data" name="data" placeholder="Enter data" />
      </div>
    </div>

    <CommonButton
      type="submit"
      :disabled="sendingDisabled"
      :loading="loading"
      class="justify-center w-full"
      size="lg"
    >
      Submit
    </CommonButton>
  </form>
</template>
