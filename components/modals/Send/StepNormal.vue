<script setup lang="ts">
import { Erc20__factory } from '~~/contracts'

const { token, stepBack, data, actualAddress, isCrossChain } = useSend()
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
      'send',
    ) as string

    if (!transactionHash)
      return

    logActionToSlack({
      message: `${formatDecimal(data.value.amount)} ${formatSymbol(
        token.value.symbol,
      )} to ${actualAddress.value}`,
      action: 'send',
      txHash: transactionHash,
      amountInUsd: amountInUsd.value.toFixed(),
      chainId: String(data.value.toChainId),
      account: account.value,
    })

    destroyModal()

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
  <form class="flex flex-col gap-7.5 sm:w-[520px] w-full" @submit.prevent="onSubmit">
    <div class="bg-slate-50 dark:bg-gray-850 rounded-5 py-[14px] px-5 text-sm">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <ChainLogo class="w-5" :chain="data.toChainId" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Token
          </dt>
          <dd class=" items-center flex gap-2">
            <SafeTokenLogo class="w-[18px] h-[18px]" :url="token?.logoURI" />
            <span class="uppercase">
              {{ token?.symbol }}
            </span>
            <span v-tippy="token?.name" class="text-slate-400 max-w-[200px] truncate">
              ({{ token?.name }})
            </span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400 whitespace-nowrap">
            To address
          </dt>
          <dd>
            <NuxtLink target="_blank" class="text-primary font-medium" :to="getExplorerUrl(data.toChainId, `/address/${actualAddress}`)" external>
              {{ actualAddress }}
            </NuxtLink>
          </dd>
        </dl>
      </div>
      <div class="ticket-divider w-full my-4" />

      <div class="flex justify-between items-center font-semibold md:text-2xl text-md">
        <span>
          Amount
        </span>
        <p class="flex items-center gap-2.5">
          <span class="uppercase">
            {{ formatDecimal(data.amount) }} {{ token?.symbol }}
          </span>
          <span class="text-slate-400">
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
  </form>
</template>
