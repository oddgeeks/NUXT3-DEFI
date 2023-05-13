<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import { Erc20__factory } from '~~/contracts'

const emit = defineEmits(['destroy'])
const { token, stepBack, data, actualAddress } = useSend()
const { account, library } = useWeb3()
const { toWei } = useBignumber()
const { sendTransactions } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()

const isSubmitting = ref(false)
const amountInUsd = computed(() => toBN(token.value?.price || 0).times(data.value.amount))

const { data: txs } = useAsyncData(
  async () => {
    if (!data.value.tokenAddress || isZero(data.value.amount) || !token.value || !actualAddress.value)
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
    watch: [actualAddress, () => data.value.fromChainId, () => data.value.toChainId, () => data.value.fromChainId, () => data.value.amount],
  },
)
const { data: feeData, pending, error } = useEstimatedFee(txs, ref(String(data.value.toChainId)))

const disabled = computed(() => {
  return !actualAddress.value || pending.value || error.value || isSubmitting.value
})

async function onSubmit() {
  try {
    if (!token.value || !data.value)
      return

    isSubmitting.value = true

    const metadata = encodeTransferMetadata(
      {
        token: token.value?.address!,
        amount: toWei(data.value.amount, token.value?.decimals),
        receiver: actualAddress.value,
      },
      true,
    )

    const transactionHash = await sendTransactions(
      txs.value!,
      Number(data.value.toChainId),
      {
        metadata,
      },
    )

    console.log(transactionHash)

    logActionToSlack({
      message: `${formatDecimal(data.value.amount)} ${formatSymbol(
        token.value.symbol,
      )} to ${actualAddress.value}`,
      action: 'send',
      txHash: transactionHash,
      chainId: String(data.value.toChainId),
      account: account.value,
    })

    emit('destroy')

    showPendingTransactionModal(transactionHash, data.value.toChainId, 'send')
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
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-7.5" @submit.prevent="onSubmit">
    <div class="bg-slate-50 dark:bg-gray-850 rounded-5 py-[14px] px-5 text-sm">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <span>{{ chainIdToName(data.fromChainId) }}</span>
            <ArrowRight class="text-slate-400 w-4" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Token
          </dt>
          <dd class="uppercase">
            {{ token?.symbol }}
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Address
          </dt>
          <dd>
            {{ shortenHash(data.address) }}
          </dd>
        </dl>
      </div>
      <div class="ticket-divider w-full my-4" />
      <div class="flex justify-between items-center font-semibold text-base">
        <span>
          You send
        </span>
        <p class="flex items-center gap-2.5">
          <span class="uppercase">
            {{ formatDecimal(data.amount) }} {{ token?.symbol }}
          </span>
          <span class="text-xs text-slate-400">
            ({{ formatUsd(amountInUsd) }})
          </span>
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-5">
      <CommonButton color="white" class="justify-center" size="lg" @click="stepBack">
        Back
      </CommonButton>
      <CommonButton :disabled="disabled" :loading="pending || isSubmitting" type="submit" class="justify-center" size="lg">
        Send
      </CommonButton>
    </div>

    <EstimatedFee
      :loading="pending"
      :data="feeData"
      :error="error"
    />
  </form>
</template>
