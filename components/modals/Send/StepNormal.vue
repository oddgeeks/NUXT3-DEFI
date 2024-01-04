<script setup lang="ts">
import { Erc20__factory } from '~~/contracts'

const { token, stepBack, data, actualAddress, isCrossChain } = useSend()
const { addToTransactionStack } = useShared()
const { account, library } = useWeb3()
const { toWei } = useBignumber()
const { sendTransactions } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()

const isSubmitting = ref(false)
const amountInUsd = computed(() => toBN(token.value?.price || 0).times(data.value.amount))

const destroyModal = inject('destroy') as () => void

const { data: txs } = useAsyncData(
  'send-txs',
  async () => {
    if (!data.value.tokenAddress || isZero(data.value.amount) || !token.value || !actualAddress.value)
      return

    if (isCrossChain.value)
      return

    const txs = []

    const transferAmount = toBN(data.value.amount)
      .times(10 ** token.value?.decimals)
      .toFixed()

    if (token.value.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
      txs.push({
        from: account.value,
        to: actualAddress.value,
        value: transferAmount,
        data: '0x',
      })
    }
    else {
      const contract = Erc20__factory.connect(token.value.address, library.value)

      const { data: transferData } = await contract.populateTransaction.transfer(
        actualAddress.value,
        transferAmount,
      )

      txs.push({
        from: account.value,
        to: token.value.address,
        value: '0',
        data: transferData,
      })
    }

    return txs
  },
  {
    immediate: true,
    server: false,
    watch: [data],
  },
)

const { data: feeData, pending, error } = useEstimatedFee(txs, ref(String(data.value.fromChainId)))

const disabled = computed(() => {
  return !actualAddress.value || pending.value || error.value || isSubmitting.value
})

function getMetadata(single?: boolean) {
  if (!token.value || !data.value)
    return

  return encodeTransferMetadata(
    {
      token: token.value?.address!,
      amount: toWei(data.value.amount, token.value?.decimals),
      receiver: actualAddress.value,
    }, single)
}

const metadata = computed(() => {
  if (!token.value || !data.value)
    return

  return getMetadata(false)
})

async function onSubmit() {
  try {
    if (!token.value || !data.value)
      return

    const metadata = getMetadata()

    isSubmitting.value = true

    const transactionHash = await sendTransactions(
      txs.value!,
      Number(data.value.toChainId),
      {
        metadata,
      },
      'transfer',
    ) as string

    if (!transactionHash)
      return

    logActionToSlack({
      message: generateSlackMessage(metadata!, data.value.toChainId),
      action: 'transfer',
      txHash: transactionHash,
      amountInUsd: amountInUsd.value.toFixed(),
      chainId: String(data.value.toChainId),
      account: account.value,
    })

    destroyModal()

    showPendingTransactionModal({
      hash: transactionHash,
      chainId: data.value.toChainId,
      type: 'transfer',
    })
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'transfer',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="flex w-full flex-col gap-7.5 pb-12 sm:w-[520px]" @submit.prevent="onSubmit">
    <div class="mx-[-0.75rem] rounded-5 bg-gray-850 px-3 py-[14px] text-sm sm:mx-0 sm:px-5">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-gray-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <ChainLogo class="w-5" :chain="data.toChainId" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-gray-400">
            Token
          </dt>
          <dd class=" flex items-center gap-2">
            <SafeTokenLogo class="h-[18px] w-[18px]" :url="token?.logoURI" />
            <span class="uppercase">
              {{ token?.symbol }}
            </span>
            <span v-tippy="token?.name" class="max-w-[200px] truncate text-gray-400">
              ({{ token?.name }})
            </span>
          </dd>
        </dl>
        <dl class="flex flex-wrap items-center justify-between">
          <dt class="whitespace-nowrap text-gray-400">
            To address
          </dt>
          <dd>
            <NuxtLink target="_blank" class="text-xs font-medium text-primary sm:text-sm" :to="getExplorerUrl(data.toChainId, `/address/${actualAddress}`)" external>
              {{ actualAddress }}
            </NuxtLink>
          </dd>
        </dl>
      </div>
      <div class="ticket-divider my-4 w-full" />

      <div class="text-md flex items-center justify-between font-semibold sm:text-2xl">
        <span>
          Amount
        </span>
        <p class="flex items-center gap-2.5">
          <span class="uppercase">
            {{ formatDecimal(data.amount) }} {{ token?.symbol }}
          </span>
          <span class="text-gray-400">
            ({{ formatUsd(amountInUsd) }})
          </span>
        </p>
      </div>
    </div>
    <EstimatedFee
      :loading="pending"
      :data="feeData"
      :error="error"
    />
    <div class="grid grid-cols-2 gap-5">
      <CommonButton color="white" class="justify-center" size="lg" @click="stepBack">
        Back
      </CommonButton>

      <CommonButton :disabled="disabled" :loading="pending || isSubmitting" type="submit" class="justify-center" size="lg">
        Send
      </CommonButton>
    </div>
    <AddBatchButton v-if="metadata" class="absolute bottom-7.5 left-7.5" :tx-actions="txs" :chain-id="data.toChainId" :metadata="metadata" />
  </form>
</template>
