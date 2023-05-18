<script setup lang="ts">
import { ethers } from 'ethers'
import { serialize } from 'error-serializer'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import { Erc20__factory } from '~~/contracts'

const emit = defineEmits(['destroy'])
const { isProd } = useAppConfig()
const { token, stepBack, data, actualAddress, targetToken } = useSend()
const { account, library } = useWeb3()
const { toWei } = useBignumber()
const { sendTransactions, safeAddress, safe } = useAvocadoSafe()
const { avoProvider } = useSafe()
const { parseTransactionError } = useErrorHandler()

const isSubmitting = ref(false)
const amountInUsd = computed(() => toBN(token.value?.price || 0).times(data.value.amount))

const isCrossChain = computed(() => String(data.value.fromChainId) !== String(data.value.toChainId))

const crossSignatures = ref<ICrossSignatures>()

const { data: crossFeeData, pending: crossPending, error: crossError } = useAsyncData(async () => {
  if (!crossSignatures.value) {
    return calculateEstimatedFee({
      chainId: String(data.value.toChainId),
    })
  }

  console.log(crossSignatures.value)

  const resp = await http('/api/cross-chain/estimate', {
    method: 'POST',
    body: {
      staging: !isProd,
      sourceChainId: String(data.value.fromChainId),
      targetChainId: String(data.value.toChainId),
      target: crossSignatures.value.target.message,
      source: crossSignatures.value.source.message,
      bridge: {
        token: targetToken.value?.address,
        amount: toWei(data.value.amount, targetToken.value?.decimals!),
      },
      signer: account.value,
      avocadoSafe: safeAddress.value,
    },
  }) as ICrossEstimatedFee

  const combinedFeeParams = [resp.target, resp.source].reduce(
    (acc, curr) => {
      acc.fee = toBN(acc.fee).plus(toBN(curr.fee)).toString()
      acc.multiplier = toBN(acc.multiplier).plus(toBN(curr.multiplier)).toString()
      return acc
    },
    { fee: '0', multiplier: '0' },
  )

  return calculateEstimatedFee({
    chainId: String(data.value.fromChainId),
    fee: combinedFeeParams.fee,
    multiplier: combinedFeeParams.multiplier,
  })
}, {
  watch: [crossSignatures],
})

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
    watch: [crossSignatures],
  },
)

async function fetchcrossSignatures() {
  try {
    if (!targetToken.value?.address)
      return

    isSubmitting.value = true

    const quoteRoute: ISocketQuoteResult = await http('/api/socket/v2/quote', {
      params: {
        fromChainId: data.value.fromChainId,
        toChainId: data.value.toChainId,
        fromTokenAddress: token.value?.address,
        toTokenAddress: targetToken.value?.address,
        fromAmount: toWei(data.value.amount, token.value?.decimals!),
        userAddress: safeAddress.value,
        recipient: safeAddress.value,
        isContractCall: true,
        defaultBridgeSlippage: 0.5,
        singleTxOnly: true,
        sort: 'output',
      },
    })

    if (!quoteRoute.success)
      throw new Error('Can\'t get quote')

    if (!quoteRoute.result.routes.length)
      throw new Error('No routes found')

    const bestRoute = quoteRoute.result.routes[0]

    const buildTx: IScoketBuildTxResult = await http('/api/socket/v2/build-tx',
      {
        method: 'POST',
        body: {
          route: bestRoute,
        },
      },
    )

    if (!buildTx.success)
      throw new Error('Can\'t build tx')

    const ERC20ABI = [
      'function approve(address, uint256) external',
      'function transfer(address, uint256) external',
    ]

    const approvalData = buildTx.result.approvalData

    const transferAmount = bestRoute.userTxs[0].steps[0].minAmountOut.toString()

    const targetActions = [
      {
        to: targetToken.value.address,
        data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('transfer', [account.value, transferAmount]),
        operation: '0',
        value: '0',
      },
    ]

    const sourceActions = [
      {
        to: approvalData.approvalTokenAddress,
        data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('approve', [approvalData.allowanceTarget, approvalData.minimumApprovalAmount]),
        operation: '0',
        value: '0',
      },
      {
        to: buildTx.result.txTarget,
        data: buildTx.result.txData,
        operation: '0',
        value: '0',
      },
    ]

    const targetMessage = await safe.value?.generateSignatureMessage(
      targetActions,
      data.value.toChainId,
    )

    const sourceMessage = await safe.value?.generateSignatureMessage(
      sourceActions,
      data.value.fromChainId,
    )

    const { payload, success } = await openSignCrossSendTx({
      sourceChainId: data.value.fromChainId,
      targetChainId: data.value.toChainId,
      sourceMessage,
      targetMessage,
    })

    if (!success)
      throw new Error('Can\'t sign tx')

    crossSignatures.value = payload
  }
  catch (e: any) {
    const err = serialize(e)

    openSnackbar({
      message: err.message,
      type: 'error',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

const { data: feeData, pending, error } = useEstimatedFee(txs, ref(String(data.value.fromChainId)))

const actualFeeError = computed(() => isCrossChain.value ? crossError.value : error.value)
const actualFeeData = computed(() => isCrossChain.value ? crossFeeData.value : feeData.value)
const actualFeePending = computed(() => isCrossChain.value ? crossPending.value : pending.value)

const disabled = computed(() => {
  return !actualAddress.value || actualFeePending.value || actualFeeError.value || isSubmitting.value
})

async function onSubmit() {
  try {
    if (!token.value || !data.value)
      return

    isSubmitting.value = true

    let transactionHash = ''
    let metadata = ''

    if (isCrossChain.value) {
      if (!crossSignatures.value)
        throw new Error('Signatures not found')

      metadata = encodeCrossTransferMetadata(
        {
          fromToken: data.value.tokenAddress,
          toToken: targetToken.value?.address,
          toChainId: data.value.toChainId,
          amount: toWei(data.value.amount, token.value?.decimals),
          receiver: data.value.address,
        },
        true,
      )

      transactionHash = await avoProvider.send('api_requestCrosschainTransaction', [crossSignatures.value.source, crossSignatures.value.target])

      if (!transactionHash)
        throw new Error('Transaction not found')
    }
    else {
      metadata = encodeTransferMetadata(
        {
          token: token.value?.address!,
          amount: toWei(data.value.amount, token.value?.decimals),
          receiver: actualAddress.value,
        },
        true,
      )

      transactionHash = await sendTransactions(
        txs.value!,
        Number(data.value.toChainId),
        {
          metadata,
        },
      )
    }

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

      <CommonButton v-if="isCrossChain && !crossSignatures" :disabled="disabled" :loading="actualFeePending || isSubmitting" class="justify-center" size="lg" @click="fetchcrossSignatures">
        Sign
      </CommonButton>
      <CommonButton v-else :disabled="disabled" :loading="actualFeePending || isSubmitting" type="submit" class="justify-center" size="lg">
        Send
      </CommonButton>
    </div>

    <EstimatedFee
      :loading="actualFeePending"
      :data="actualFeeData"
      :error="actualFeeError"
    />
  </form>
</template>
